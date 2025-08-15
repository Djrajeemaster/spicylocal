
/* === Heat helper (global-safe) === */
(function(g){
  if (typeof g.heatScore !== "function") {
    g.heatScore = function(views, up, fake){
      var raw = (Number(views||0)*0.4) + (Number(up||0)*3) - (Number(fake||0)*4);
      return Math.max(0, Math.min(100, Math.round(raw / 2)));
    };
  }
})(typeof window!=="undefined"?window:globalThis);
/* === End heat helper === */

/* Popularity → color mapper (red → orange → green) */
function heatColor(score){
  score = Number(score||0);
  if (score <= 30) return "#ef4444";   // red
  if (score <= 70) return "#f97316";   // orange
  return "#22c55e";                    // green
}

document.addEventListener("DOMContentLoaded", function () {
  // 1) Service worker (best-effort)
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("firebase-messaging-sw.js", { scope: "./" }).catch(function(){});
  }

  var dealList = document.getElementById("deal-list");
  if (dealList) {
    var SB = { page: 1, limit: 24, category: "", sort: "views", q: "" };

    function esc(s){ s = "" + (s || ""); return s.replace(/[&<>"]/g, function(c){ return ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;" }[c]); }); }
    function fmt(n){ n = Number(n||0); return n >= 1000 ? (n/1000).toFixed(1)+"k" : n; }
    function pickThumb(t){ if (!t || !String(t).trim()) return "uploads/default.jpg"; var s = String(t).trim(); return (s.indexOf("/")>=0 || s.indexOf("http")===0) ? s : ("uploads/" + s); }
    function snippet(txt, n){ n = (typeof n === "number" ? n : 160); var s = (txt||"").replace(/\s+/g," ").trim(); return s.length > n ? s.slice(0, n-1) + "…" : s; }
    function isRecent(createdAt, days){ days = (typeof days === "number" ? days : 7); var t = Date.parse(createdAt); if (isNaN(t)) return true; return (Date.now() - t) <= (days * 86400000); }
    function getSeenDeals(){ try { return new Set(JSON.parse(localStorage.getItem("sb_seen_deals")||"[]")); } catch (e) { return new Set(); } }

    function normDeals(resp){
      if (Array.isArray(resp)) return { items: resp, total: resp.length, page: 1, pages: 1 };
      if (resp && Array.isArray(resp.items)) return resp;
      if (resp && resp.items && typeof resp.items === "object") {
        var arr = []; for (var k in resp.items){ if(Object.prototype.hasOwnProperty.call(resp.items,k)) arr.push(resp.items[k]); }
        return { items: arr, total: arr.length, page: resp.page||1, pages: resp.pages||1 };
      }
      if (resp && Array.isArray(resp.deals)) {
        var per = Number(resp.per_page || 10);
        var total = Number(resp.total || resp.deals.length || 0);
        var pages = Number(resp.total_pages || Math.ceil(total / (per||10)) || 1);
        return { items: resp.deals, total: total, page: resp.page||1, pages: pages };
      }
      return { items: [], total: 0, page: 1, pages: 1 };
    }

    // Robust fetch that won't die on HTML error pages
    function fetchJSON(url){
      return fetch(url, { cache: "no-store" })
        .then(function(res){ return res.text().then(function(t){ return { ok: res.ok, text: t }; }); })
        .then(function(r){
          if (!r.ok) {
            var clip = (r.text||"").slice(0,200);
            throw new Error("HTTP "+(r.ok?200:0)+" body: "+clip);
          }
          // Detect accidental HTML/PHP notices
          var trimmed = (r.text||"").trim();
          if (trimmed.charAt(0) === "<") {
            var clip = trimmed.slice(0,200);
            throw new Error("Expected JSON, got HTML: " + clip);
          }
          try { return JSON.parse(r.text); } catch(e){ throw new Error("Bad JSON: " + (r.text||"").slice(0,200)); }
        });
    }

    function fetchAll()
{
  // Build stable QS for dedupe
  SB.limit = SB.limit && SB.limit > 0 ? SB.limit : 24;
  var qs = "page=" + encodeURIComponent(SB.page)
         + "&limit=" + encodeURIComponent(SB.limit)
         + "&category=" + encodeURIComponent(SB.category)
         + "&sort=" + encodeURIComponent(SB.sort)
         + "&q=" + encodeURIComponent(SB.q || SB.keyword || SB.search || "")
         + "&status=approved";

  // Lock + same-QS dedupe → return last payload (or safe stub)
// Lock + same-QS dedupe → skip re-render (return null; boot() will ignore)
if (window.__sbFetchBusy || window.__sbLastQS === qs) { return Promise.resolve(null); }


  window.__sbFetchBusy = true;

  return fetchJSON("api/get_deals.php?" + qs)
    .then(function(dealsJson){
      var deals = (dealsJson && Array.isArray(dealsJson.deals)) ? dealsJson.deals : [];
      var ids = deals.map(function(d){ return d.id; }).join(",");

      if (!ids) {
        var payload = { meta: dealsJson, deals: deals, countsById: {} };
        window.__sbLastQS = qs;
        window.__sbLastResult = payload;
        return payload;
      }

      return fetchJSON("api/get_reports.php?ids=" + ids)
        .then(function(data){
          var countsById = {};
          var arr = (data && Array.isArray(data.counts)) ? data.counts : [];
          for (var i=0;i<arr.length;i++){
            var row = arr[i]; var rid = row && row.id; if (rid == null) continue;
            countsById[String(rid)] = {
              upvotes: Number(row.upvotes || 0),
              downvotes: Number(row.downvotes || 0),
              reports: Number(row.reports || 0)
            };
          }
          var payload = { meta: dealsJson, deals: deals, countsById: countsById };
          window.__sbLastQS = qs;
          window.__sbLastResult = payload;
          return payload;
        })
        .catch(function(){
          var payload = { meta: dealsJson, deals: deals, countsById: {} };
          window.__sbLastQS = qs;
          window.__sbLastResult = payload;
          return payload;
        });
    })
    .catch(function(err){
      console.error('[fetchAll] error', err);
      return { meta: { total: 0 }, deals: [], countsById: {} };
    })
    .finally(function(){
      window.__sbFetchBusy = false;
    });
}



    function renderDeal(d, counts){
      var seen = getSeenDeals();
      var createdAt = d.created_at || d.createdAt || d.created || "";
      var isNewForUser = (!seen.has(String(d.id))) && isRecent(createdAt);
      var title    = d.title || "";
      var desc     = snippet(d.summary || d.description);
      var username = d.username || "Unknown";
      var views    = Number(d.views || 0);
      var price    = (d.price && d.price !== "0.00") ? ("₹" + d.price) : "";
      var city     = d.location || "";
      var icPerson = '<svg class="ic ic-user" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4 20a8 8 0 0 1 16 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
      var icCheck  = '<svg class="ic ic-check" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M5 13l4 4 10-10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      var icStore  = '<svg class="ic ic-store" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M3 10l1-5h16l1 5M5 10v9h14v-9M9 19v-5h6v5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      var icEye    = '<svg class="ic ic-eye" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
    
      var pinned   = String(d.is_pinned||"0")==="1" ? "📌 " : "";
      var verified = Number(d.is_verified) === 1 ? '<span class="role-badge is-verified" title="Verified user">' + icCheck + '</span>' : '';
      var vbiz     = Number(d.is_verified_business) === 1 ? '<span class="role-badge is-biz" title="Verified business">' + icStore + '</span>' : '';
      var thumb    = pickThumb(d.thumbnail || d.image);

      var c = counts[String(d.id)] || {};
      var upvoteCount = Number(c.upvotes || d.upvotes || 0);
      var downvoteCount = Number(c.downvotes || d.downvotes || 0);
      var reportAbuse = Number(c.reports || d.reports || 0);

      var score = (typeof heatScore==='function'
        ? heatScore
        : function(v,u,f){ var raw=(Number(v||0)*0.4)+(Number(u||0)*3)-(Number(f||0)*4); return Math.max(0,Math.min(100,Math.round(raw/2))); }
      )(views, upvoteCount, 0);

      return [
        '<a href="deal.html?id=', String(d.id), '" class="deal-card">',
          '<div class="heat-badge" style="background: conic-gradient(', heatColor(score), ' 0% ', String(score), '%, #f3f4f6 ', String(score), '%);"><span>', String(score), '</span></div>',
          '<div class="deal-thumb">',
            '<img loading="lazy" decoding="async" src="', esc(thumb), '" ' + 'srcset="' + esc(thumb) + ' 480w, ' + esc(thumb) + ' 960w" sizes="(max-width:600px) 50vw, 320px" alt="Deal: ' + esc(title) + '">',
          '</div>',
          '<div class="deal-content">',
            '<h3 class="deal-title">', pinned, esc(title), (isNewForUser ? ' <span class="badge-new">NEW</span>' : ''), '</h3>',
            (desc ? '<p class="deal-description">' + esc(desc) + '</p>' : ''),
            '<div class="deal-meta">' + icPerson + ' ' + esc(username) + ' ' + verified + ' ' + vbiz + '</div>',
            '<div class="deal-footer">',
              '<div class="deal-meta-inline">',
                
                (price ? '<span>' + price + '</span>' : ''),
                (city ? '<span>' + esc(city) + '</span>' : ''),
              '</div>',
              '<div class="metrics metrics--static">' +
                '<span class="metric"><svg class="ic" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M2 10h4v10H2zM8 21h7.2a3 3 0 0 0 2.94-2.46l1.18-7A3 3 0 0 0 16.37 8H13V5a3 3 0 0 0-3-3l-2 6v13z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg><span class="count">' + fmt(upvoteCount) + '</span></span>',
                '<span class="metric"><svg class="ic" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M22 14h-4V4h4zM16 3H8.8A3 3 0 0 0 5.86 5.46l-1.18 7A3 3 0 0 0 7.63 16H11v3a3 3 0 0 0 3 3l2-6V3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg><span class="count">' + fmt(downvoteCount) + '</span></span>',
                '<span class="metric">' + icEye + '<span class="count">' + fmt(views) + '</span></span>',
              '</div>',
            '</div>',
          '</div>',
        '</a>'
      ].join('');
    }

    function renderPagination(totalPages, current){
      var el = document.getElementById('pagination');
      if (!el) return;
      totalPages = Number(totalPages || 1);
      current = Number(current || 1);
      if (totalPages <= 1){ el.innerHTML = ''; return; }
      var windowSize = 5;
      var start = Math.max(1, current - Math.floor(windowSize/2));
      var end = Math.min(totalPages, start + windowSize - 1);
      start = Math.max(1, end - windowSize + 1);
      var html = '';
      function btn(p, label, disabled, currentB){
        label = (label==null? p : label);
        return '<button class="pg-btn ' + (currentB?'is-current':'') + '" data-page="' + p + '" ' + (disabled?'disabled':'') + '>' + label + '</button>';
      }
      html += btn(1, '« First', current === 1, false);
      html += btn(Math.max(1, current - 1), '‹ Prev', current === 1, false);
      for (var i = start; i <= end; i++) html += btn(i, String(i), false, i === current);
      html += btn(Math.min(totalPages, current + 1), 'Next ›', current === totalPages, false);
      html += btn(totalPages, 'Last »', current === totalPages, false);
      el.innerHTML = html;
    }

    function renderList(payload, append){
      var dealsRaw = payload.meta || payload;
      var out = normDeals(dealsRaw);
      var items = out.items, page = out.page, pages = out.pages;
      var countsById = payload.countsById || {};

      if (!append) { dealList.innerHTML = ''; }
if (items && items.length) {
  var html = items.map(function(d){ return renderDeal(d, countsById); }).join("");
  if (append) { dealList.insertAdjacentHTML('beforeend', html); } else { dealList.innerHTML = html; }
} else if (!append) {
  dealList.innerHTML = "<p>No deals found.</p>";
}

      // pagination
      try{
        var meta = (dealsRaw && typeof dealsRaw==='object') ? dealsRaw : {};
        var totalPages = Number(meta.total_pages || meta.pages || Math.ceil((Number(meta.total||0)) / (Number(meta.per_page || 10))) || 1);
        var cur = Number(meta.page || 1);
        renderPagination(totalPages, cur);
      }catch(e){}
    }

    function boot(){  var append = (SB.__append === true);
  SB.__append = false;

  fetchAll()
    .then(function(payload){ if (!payload || !payload.meta) return; renderList(payload, append);
    })
    .catch(function(err){
      console.error("Error loading deals:", err);
      dealList.innerHTML = "<p>Error loading deals.</p>";
    });
}
    
	
window.SB   = window.SB || SB;
window.boot = window.boot || boot;
// --- built-in search wiring (debounced 600ms, min 3 chars, Enter to force) ---
(function bindSearch(retries){
  if (window.__sbSearchBound) return; // avoid double-binding from external search.js
  var si = document.getElementById('deal-search');
  if (!si) { if ((retries||0) < 30) return setTimeout(function(){ bindSearch((retries||0)+1); }, 100); else return; }
  window.__sbSearchBound = true;

  try { if (typeof SB.q === 'string' && !si.value) si.value = SB.q; } catch(e){}

  var DEBOUNCE_MS = 400;
  var MIN_LEN = 2;
  var timer = null;
  var lastSent = (typeof SB.q === 'string') ? SB.q : '';
  function fire(force) {
    var q = (si.value || '').trim();
    if (!force) {
      if (q.length === 0 && lastSent === '') return;   // nothing to do
      if (q.length > 0 && q.length < MIN_LEN) return;  // wait for 3+ chars
    }
    if (q === lastSent) return;                        // unchanged -> skip
    lastSent = q;
    SB.q = q; SB.keyword = q; SB.search = q;
    SB.page = 1; SB.hasMore = true; SB.__append = false;
    window.boot();
  }
  si.addEventListener('input', function(){ clearTimeout(timer); timer = setTimeout(function(){ fire(false); }, DEBOUNCE_MS); });
  si.addEventListener('keydown', function(e){ if (e.key === 'Enter') { clearTimeout(timer); fire(true); } });
})(0);
// --- infinite scroll (IntersectionObserver) ---
(function setupInfiniteScroll(){
  var sentinel = document.getElementById('scroll-sentinel');
  if (!sentinel) {
    sentinel = document.createElement('div');
    sentinel.id = 'scroll-sentinel';
    sentinel.style.height = '1px';
    sentinel.style.width  = '100%';
    var dl = document.getElementById('deal-list');
    if (dl && dl.parentNode) dl.parentNode.insertBefore(sentinel, dl.nextSibling);
  }
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function(entries){
    var e = entries[0];
    if (!e || !e.isIntersecting) return;
    if (window.__sbFetchBusy) return;
    if (!SB.hasMore) return;
    SB.page = (SB.page || 1) + 1;
    SB.__append = true;
    window.boot();
  }, { root: null, rootMargin: '600px', threshold: 0 });
  io.observe(sentinel);
})();
// (removed duplicate server-side search binder)

    document.addEventListener('click', function(e){
      var b = e.target.closest ? e.target.closest('.pg-btn[data-page]') : null;
      if (!b) return;
      var p = Number(b.getAttribute('data-page'));
      if (!isFinite(p)) return;
      SB.page = Math.max(1, p);
      SB.__append = false;
      boot();
    });

    window.addEventListener('pageshow', function(){ try { if (document.getElementById('deal-list')) boot(); } catch (e) {} });

    boot();
  }

  // Header auth refresh
  function __refreshHeaderAuth(){
    try{
      fetch('api/me.php', {credentials:'include', cache:'no-store'})
        .then(function(r){ return r.text(); })
        .then(function(t){
          var me; try { me = JSON.parse(t); } catch(e){ throw new Error('badjson'); }
          if(!me || !me.ok){ throw new Error('unauth'); }
          Array.prototype.forEach.call(document.querySelectorAll('.user-menu'), function(el){ el.classList.remove('hidden'); });
          Array.prototype.forEach.call(document.querySelectorAll('.login-link'), function(el){ el.classList.add('hidden'); });
          Array.prototype.forEach.call(document.querySelectorAll('.username-label, .user-name'), function(el){ el.textContent = me.username || ''; });
        })
        .catch(function(){
          Array.prototype.forEach.call(document.querySelectorAll('.user-menu'), function(el){ el.classList.add('hidden'); });
          Array.prototype.forEach.call(document.querySelectorAll('.login-link'), function(el){ el.classList.remove('hidden'); });
        });
    }catch(err){}
  }
  document.addEventListener('DOMContentLoaded', __refreshHeaderAuth);

  // 2) Push notifications using Firebase **compat** builds (no modules)
  var username = null; try { username = localStorage.getItem("username"); } catch(e){}
  if (username) {
    setTimeout(function(){
      try {
        var s1 = document.createElement('script'); s1.src = "https://www.gstatic.com/firebasejs/11.0.1/firebase-app-compat.js";
        var s2 = document.createElement('script'); s2.src = "https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging-compat.js";
        s2.onload = function(){
          try {
            var firebaseConfig = {
              apiKey: "AIzaSyDE2UrLCv9zrUk94ZHd5Aj5EQR_bb_UuO0",
              authDomain: "spicybeats-app.firebaseapp.com",
              projectId: "spicybeats-app",
              storageBucket: "spicybeats-app.firebasestorage.app",
              messagingSenderId: "248095282713",
              appId: "1:248095282713:web:4b951995f1c6b2fd147c88"
            };
            firebase.initializeApp(firebaseConfig);
            var messaging = firebase.messaging();
            Notification.requestPermission().then(function(permission){
              if (permission === "granted") {
                navigator.serviceWorker.getRegistration().then(function(reg){
                  messaging.getToken({
                    vapidKey: "BN4i6amvqzyOcM29Vr6wSPeX27Emhmi-O1wfnsHU3Ljer--cVHpbBxYA8zZbr4Uk3hlP7USjmn5SLckghnHGt10",
                    serviceWorkerRegistration: reg
                  }).then(function(token){
                    if (!token) return;
                    fetch("api/save_token.php", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ username: username, token: token })
                    });
                  }).catch(function(e){ console.warn("FCM getToken failed:", e); });
                });
              }
            });
          } catch (err) { console.error("Push notification setup failed:", err); }
        };
        document.head.appendChild(s1); document.head.appendChild(s2);
      } catch (err) { console.error("Push notification setup failed:", err); }
    }, 1000);
  }
});


/* Service Worker (runtime caching) */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/bagit/sw.js').catch(function(e){ console.warn('SW register failed', e); });
}

// Debounced boot available for callers
(function(){
  if (typeof window.safeBoot !== 'function') {
    var __t = null;
    window.safeBoot = function(){
      if (__t) clearTimeout(__t);
      __t = setTimeout(function(){ try { if (typeof window.boot==='function') window.boot(); } catch(e){} }, 150);
    };
  }
})();
