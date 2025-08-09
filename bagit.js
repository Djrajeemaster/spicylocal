/* === Heat helper (global-safe) === */
(function(g){
  if (typeof g.heatScore !== "function") {
    g.heatScore = function(views, up, fake){
      const raw = (Number(views||0)*0.4) + (Number(up||0)*3) - (Number(fake||0)*4);
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

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ bagit.js loaded");

  // 1️⃣ Register service worker for push notifications
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("firebase-messaging-sw.js", { scope: "./" })
      .then(reg => console.log("✅ Service Worker registered:", reg))
      .catch(err => console.error("❌ Service Worker registration failed:", err));
  }

  // Load feature flags
  let featureFlags = {};
  (async () => {
    try {
      const res = await fetch("api/feature_flags.php");
      featureFlags = await res.json();
    } catch {
      featureFlags = {};
    }
  })();

  const username = localStorage.getItem("username");

  // === HOME PAGE DEAL LIST (with real counters) ===
  const dealList = document.getElementById("deal-list");
  if (dealList) {
    const SB = { page: 1, limit: 10, category: "", sort: "views", q: "" };

    /* Track deals viewed by this user (client-side) */
    function getSeenDeals(){
      try { return new Set(JSON.parse(localStorage.getItem("sb_seen_deals")||"[]")); } catch { return new Set(); }
    }
    function markSeen(id){
      try {
        const s = getSeenDeals(); s.add(String(id));
        localStorage.setItem("sb_seen_deals", JSON.stringify([...s]));
      } catch {}
    }
    /* "NEW" time window */
    const SB_NEW_DAYS = 7;
    function isRecent(createdAt, days=SB_NEW_DAYS){
      const t = Date.parse(createdAt);
      if (isNaN(t)) return true; // fallback if backend date missing
      return (Date.now() - t) <= (days * 86400000);
    }

    const esc = s => ("" + (s || "")).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;" }[c]));
    const fmt = n => (Number(n||0) >= 1000 ? (Number(n)/1000).toFixed(1)+"k" : (Number(n||0)));
    const pickThumb = t => {
      if (!t || !String(t).trim()) return "uploads/default.jpg";
      const s = String(t).trim();
      return (s.includes("/") || s.startsWith("http")) ? s : `uploads/${s}`;
    };
    const snippet = (txt, n=160) => {
      const s = (txt||"").replace(/\s+/g," ").trim();
      return s.length > n ? s.slice(0, n-1) + "…" : s;
    };

    // Normalizers (accept array, object-map, or paged)
    const normDeals = resp => {
      if (Array.isArray(resp)) return { items: resp, total: resp.length, page: 1, pages: 1 };
      if (resp && Array.isArray(resp.items)) return resp;
      if (resp && resp.items && typeof resp.items === "object") {
        const arr = Object.values(resp.items);
        return { items: arr, total: arr.length, page: resp.page||1, pages: resp.pages||1 };
      }
      // Some APIs return { ok, page, per_page, total, total_pages, deals: [] }
      if (resp && Array.isArray(resp.deals)) {
        const pages = Number(resp.total_pages || Math.ceil((resp.total||0)/(resp.per_page||SB.limit||10)) || 1);
        return { items: resp.deals, total: resp.total||resp.deals.length, page: resp.page||1, pages };
      }
      return { items: [], total: 0, page: 1, pages: 1 };
    };
    const toMap = (data, idKey="id") => {
      if (!data) return {};
      if (Array.isArray(data)) {
        const m = {};
        data.forEach(x => { if (x && x[idKey] != null) m[String(x[idKey])] = x; });
        return m;
      }
      // already an object keyed by id
      return data;
    };

    function fetchAll(){
      const qs = new URLSearchParams({
        page: SB.page, limit: SB.limit, category: SB.category, sort: SB.sort, q: SB.q, status: "approved"
      });
      return Promise.all([
        fetch("api/get_votes.php").then(r=>r.json()).catch(()=> ({})),
        fetch("api/get_feedback.php").then(r=>r.json()).catch(()=> ({})),
        fetch(`api/get_deals.php?${qs}`).then(r=>r.json())
      ]);
    }

    function renderDeal(d, voteMap, feedbackMap){
      const seen = getSeenDeals();
      const createdAt = d.created_at || d.createdAt || d.created || "";
      const isNewForUser = (!seen.has(String(d.id))) && isRecent(createdAt);

      const idStr = String(d.id);
      const votes = voteMap[idStr] || { up: 0, down: 0 };
      const fb    = feedbackMap[idStr] || { useful: 0, fake: 0, not_interested: 0, report_abuse: 0 };

      const upvoteCount = Number(votes.up || 0);
      const fakeCount   = Number(fb.fake || 0);
      const reportAbuse = Number(fb.report_abuse || fb.abuse || fb.not_interested || 0);

      const title    = d.title || "";
      const desc     = snippet(d.summary || d.description);
      const username = d.username || "Unknown";
      const views    = Number(d.views || 0);
      const price    = d.price && d.price !== "0.00" ? `₹${d.price}` : "";
      const city     = d.location || "";
      const pinned   = String(d.is_pinned||"0")==="1" ? "📌 " : "";
      const verified = Number(d.is_verified) === 1 ? '<span class="badge-verified">✔️ Verified</span>' : '';
      const vbiz     = Number(d.is_verified_business) === 1 ? '<span class="business-badge">🏬 Verified Business</span>' : '';
      const thumb    = pickThumb(d.thumbnail || d.image);

      const score = (typeof heatScore==='function'
        ? heatScore
        : (v,u,f)=>{ const raw=(Number(v||0)*0.4)+(Number(u||0)*3)-(Number(f||0)*4); return Math.max(0,Math.min(100,Math.round(raw/2))); }
      )(views, upvoteCount, fakeCount);

      return [
        '<a href="deal.html?id=', String(d.id), '" class="deal-card">',
          '<div class="heat-badge" style="background: conic-gradient(', heatColor(score), ' 0% ', String(score), '%, #f3f4f6 ', String(score), '%);"><span>', String(score), '</span></div>',
          '<div class="deal-thumb">',
            '<img loading="lazy" data-src="', esc(thumb), '" alt="Deal: ', esc(title), '">',
          '</div>',
          '<div class="deal-content">',
            '<h3 class="deal-title">', pinned, esc(title), isNewForUser ? ' <span class="badge-new">NEW</span>' : '', '</h3>',
            desc ? '<p class="deal-description">' + esc(desc) + '</p>' : '',
            '<div class="deal-meta">👤 ', esc(username), ' ', verified, ' ', vbiz, '</div>',
            '<div class="deal-footer">',
              '<div class="deal-meta-inline">',
                '<span>👁 ', fmt(views), '</span>',
                price ? '<span>' + price + '</span>' : '',
                city ? '<span>' + esc(city) + '</span>' : '',
              '</div>',
              '<div class="metrics metrics--static">',
                '<span class="metric"><i class="i-like"></i>', fmt(upvoteCount), '</span>',
                '<span class="metric"><i class="i-fake"></i>', fmt(fakeCount), '</span>',
                '<span class="metric"><i class="i-flag"></i>', fmt(reportAbuse), '</span>',
              '</div>',
            '</div>',
          '</div>',
        '</a>'
      ].join('');
    }

    function lazyImgs(){
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { const img = e.target; img.src = img.dataset.src; io.unobserve(img); }
      }), { rootMargin: "200px" });
      dealList.querySelectorAll("img[data-src]").forEach(img => io.observe(img));
    }

    function renderPagination(totalPages, current){
      const el = document.getElementById('pagination');
      if (!el) return;
      totalPages = Number(totalPages || 1);
      current = Number(current || 1);
      if (totalPages <= 1){ el.innerHTML = ''; return; }
      const windowSize = 5;
      let start = Math.max(1, current - Math.floor(windowSize/2));
      let end = Math.min(totalPages, start + windowSize - 1);
      start = Math.max(1, end - windowSize + 1);
      const btn = (p, label = p, disabled = false, currentB = false) =>
        '<button class="pg-btn ' + (currentB?'is-current':'') + '" data-page="' + p + '" ' + (disabled?'disabled':'') + '>' + label + '</button>';
      let html = '';
      html += btn(1, '« First', current === 1);
      html += btn(Math.max(1, current - 1), '‹ Prev', current === 1);
      for (let i = start; i <= end; i++) html += btn(i, String(i), false, i === current);
      html += btn(Math.min(totalPages, current + 1), 'Next ›', current === totalPages);
      html += btn(totalPages, 'Last »', current === totalPages);
      el.innerHTML = html;
    }

    function renderList([votesRaw, feedbackRaw, dealsRaw]){
      const { items, page, pages } = normDeals(dealsRaw);
      const voteMap = toMap(votesRaw);
      const feedbackMap = toMap(feedbackRaw);

      dealList.innerHTML = items.map(d => renderDeal(d, voteMap, feedbackMap)).join("") || "<p>No deals found.</p>";
      lazyImgs();

      // Robust pagination render
      try{
        const meta = (dealsRaw && typeof dealsRaw==='object') ? dealsRaw : {};
        const totalPages = Number(meta.total_pages || meta.pages || Math.ceil((meta.total||0) / (meta.per_page || SB.limit || 10)) || 1);
        const cur = Number(meta.page || SB.page || 1);
        renderPagination(totalPages, cur);
      }catch{}
    }

    function boot(){
      fetchAll()
        .then(renderList)
        .catch(err => {
          console.error("Error loading deals:", err);
          dealList.innerHTML = "<p>Error loading deals.</p>";
        });
    }

    // Controls
    const sortSel = document.getElementById("sort-select");
    if (sortSel) sortSel.addEventListener("change", e => { SB.sort = e.target.value; SB.page = 1; boot(); });

    const searchInput = document.getElementById("deal-search");
    if (searchInput && !searchInput.__sbAttached) {
      searchInput.__sbAttached = true;
      searchInput.addEventListener("input", () => {
        clearTimeout(window.__sbDebounce);
        window.__sbDebounce = setTimeout(() => {
          SB.q = searchInput.value.trim(); SB.page = 1; boot();
        }, 300);
      });
    }

    // Pager clicks and back/forward cache refresh
    document.addEventListener('click', (e) => {
      const b = e.target.closest('.pg-btn[data-page]');
      if (!b) return;
      const p = Number(b.getAttribute('data-page'));
      if (!isFinite(p)) return;
      SB.page = Math.max(1, p);
      boot();
    });
    window.addEventListener('pageshow', () => { try { if (document.getElementById('deal-list')) boot(); } catch {} });

    boot();
  } // end if(dealList)

  // (Optional) local search helper kept for other pages
  function setupSearch() {
    const input = document.getElementById("deal-search");
    if (!input) return;
    if (input.__searchAttached) return;
    input.__searchAttached = true;
    input.addEventListener("input", () => {
      const query = input.value.toLowerCase();
      const cards = document.querySelectorAll(".deal-card");
      cards.forEach(card => {
        const titleEl = card.querySelector(".deal-title, h3");
        const descEl = card.querySelector(".deal-description");
        const title = titleEl ? titleEl.textContent.toLowerCase() : "";
        const desc = descEl ? descEl.textContent.toLowerCase() : "";
        card.style.display = title.includes(query) || desc.includes(query) ? "block" : "none";
      });
    });
  }

  // 2️⃣ Push Notifications Setup — runs once after UI loads
  if (username) {
    setTimeout(() => {
      (async () => {
        try {
          const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js");
          const { getMessaging, getToken } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging.js");

          const firebaseConfig = {
            apiKey: "AIzaSyDE2UrLCv9zrUk94ZHd5Aj5EQR_bb_UuO0",
            authDomain: "spicybeats-app.firebaseapp.com",
            projectId: "spicybeats-app",
            storageBucket: "spicybeats-app.firebasestorage.app",
            messagingSenderId: "248095282713",
            appId: "1:248095282713:web:4b951995f1c6b2fd147c88"
          };

          const app = initializeApp(firebaseConfig);
          const messaging = getMessaging(app);

          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            const token = await getToken(messaging, {
              vapidKey: "BN4i6amvqzyOcM29Vr6wSPeX27Emhmi-O1wfnsHU3Ljer--cVHpbBxYA8zZbr4Uk3hlP7USjmn5SLckghnHGt10",
              serviceWorkerRegistration: await navigator.serviceWorker.getRegistration()
            });
            console.log("🔑 Push token:", token);
            await fetch("api/save_token.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username, token })
            });
          } else {
            console.warn("❌ Notifications denied");
          }
        } catch (err) {
          console.error("Push notification setup failed:", err);
        }
      })();
    }, 1000);
  }
});

// PATCH(auth): header gating via /api/me.php
async function __refreshHeaderAuth(){
  try{
    const r = await fetch('api/me.php', {credentials:'include', cache:'no-store'});
    const t = await r.text();
    const me = JSON.parse(t);
    if(!r.ok || !me.ok) throw new Error('unauth');
    document.querySelectorAll('.user-menu').forEach(el=>el.classList.remove('hidden'));
    document.querySelectorAll('.login-link').forEach(el=>el.classList.add('hidden'));
    document.querySelectorAll('.username-label, .user-name').forEach(el=>el.textContent = me.username || '');
  }catch(err){
    document.querySelectorAll('.user-menu').forEach(el=>el.classList.add('hidden'));
    document.querySelectorAll('.login-link').forEach(el=>el.classList.remove('hidden'));
  }
}
document.addEventListener('DOMContentLoaded', __refreshHeaderAuth);