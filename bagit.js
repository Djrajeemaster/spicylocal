/* SB_TOP_GLOBAL_LOAD */
try{
  document.addEventListener('load', function(e){
    try{
      var im = e.target;
      if (im && im.tagName === 'IMG'){
        var u = (im.src||'');
        if (/(^|\/)(default\.jpg)(\?.*)?$/i.test(u)) { imgFallback(im); }
      }
    }catch(_e){}
  }, true);
}catch(_e){}
// bagit.js — clean rebuild
(function(){
  'use strict';
  if (!window.imgFallback){
    window.imgFallback = function(img){
      try{
        if(!img || img.dataset.fallbackApplied) return;
        img.dataset.fallbackApplied = '1';
        var t = (img.getAttribute('data-title') || img.alt || 'Deal').slice(0,2).toUpperCase();
        var svg = ''
          + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90">'
          +   '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
          +     '<stop offset="0" stop-color="#e5e7eb"/><stop offset="1" stop-color="#ffffff"/>'
          +   '</linearGradient></defs>'
          +   '<rect width="100%" height="100%" fill="url(#g)"/>'
          +   '<text x="50%" y="55%" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,Roboto,Arial" font-weight="700" font-size="40" fill="#111827">'+t+'</text>'
          + '</svg>';
        img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
        img.classList.add('thumb--placeholder');
      }catch(e){}
    };
  }
  function esc(s){ s = String(s==null?'':s); return s.replace(/[&<>"]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]); }); }
  function fmt(n){ n = Number(n||0); return n >= 1000 ? (Math.round((n/1000)*10)/10)+'k' : String(n); }
  function snippet(txt, n){ n = (typeof n === 'number' ? n : 160); var s = String(txt||'').replace(/\s+/g,' ').trim(); return s.length>n ? s.slice(0,n-1)+'…' : s; }
  function isRecent(createdAt, days){ days = (typeof days === 'number' ? days : 7); var t = Date.parse(createdAt); if (isNaN(t)) return true; return (Date.now() - t) <= (days*86400000); }
  function getSeenDeals(){ try{ return new Set(JSON.parse(localStorage.getItem('sb_seen_deals')||'[]')); }catch(e){ return new Set(); } }
  function pickThumb(t){ var s = (t==null ? '' : String(t).trim()); if (!s) return 'default.jpg'; return (s.indexOf('/')>=0 || s.indexOf('http')===0) ? s : ('uploads/'+s); }
  function heatScore(v,u,d){ var raw=(Number(v||0)*0.4)+(Number(u||0)*3)-(Number(d||0)*4); return Math.max(0,Math.min(100,Math.round(raw/2))); }
  function heatColor(score){ score=Number(score||0); if(score<=30) return '#ef4444'; if(score<=70) return '#f97316'; return '#22c55e'; }
  function fetchJSON(url){
    return fetch(url, { cache:'no-store', credentials:'same-origin' })
      .then(function(res){ return res.text().then(function(t){ return { ok: res.ok, text: t }; }); })
      .then(function(r){
        if (!r.ok){ throw new Error('HTTP '+(r.ok?200:0)); }
        var trimmed = (r.text||'').trim();
        if (trimmed.charAt(0)==='<'){ throw new Error('Expected JSON, got HTML'); }
        try{ return JSON.parse(trimmed); }catch(e){ throw new Error('Bad JSON'); }
      });
  }
  
/* SB_HOME_REBIND */
try{
  document.addEventListener('click', function(e){
    var a = e && e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if(!a) return;
    var href = (a.getAttribute('href')||'').trim();
    // Heuristics for home links
    var isHome = a.id==='nav-home' || a.classList.contains('nav-home') || href==='#' || href==='/' || /\/bagit\/?$/.test(href) || /\/bagit\/index\.(html|php)$/.test(href);
    if(!isHome) return;
    try{
      window.SB = window.SB || {page:1,limit:24,category:'',sort:'heat',q:''};
      window.SB.page = 1; window.SB.__append = false; window.SB.hasMore = true; window.SB.renderedPageMax = 0;
      try{ var __s=document.getElementById('scroll-sentinel'); if(__s) __s.style.display=''; }catch(_e){};
      window.__sbLastQS = null; window.__sbFetchBusy = false;
      // If header intercepts and keeps us on same page, force a reboot soon.
      setTimeout(function(){ if (document.getElementById('deal-list')) (window.safeBoot||window.boot)(); }, 0);
    }catch(_e){}
  }, true);
}catch(_e){}
document.addEventListener('DOMContentLoaded', function(){ document.addEventListener('load', function(e){ try{ var im=e.target; if(im && im.tagName==='IMG' && /(?:^|\/)default\.jpg(?:\?.*)?$/i.test(im.src||'')) { imgFallback(im); } }catch(_e){} }, true); 
    if ('serviceWorker' in navigator){ navigator.serviceWorker.register('/bagit/sw.js').catch(function(){}); }
    var dealList = document.getElementById('deal-list'); if (!dealList) return;
    if (!window.SB) window.SB = { page:1, limit:24, category:'', sort:'heat', q:'', city:'', lat:null, lon:null };
    window.__sbFetchBusy = false; window.__sbLastQS = null; window.__sbLastResult = null;
    function normDeals(resp){
      if (Array.isArray(resp)) return { items: resp, total: resp.length, page: 1, pages: 1 };
      if (resp && Array.isArray(resp.items)) return resp;
      if (resp && resp.items && typeof resp.items === 'object'){ var arr=[]; for (var k in resp.items){ if (Object.prototype.hasOwnProperty.call(resp.items,k)) arr.push(resp.items[k]); } return { items: arr, total: arr.length, page: resp.page||1, pages: resp.pages||1 }; }
      if (resp && Array.isArray(resp.deals)){ var per = Number(resp.per_page || 10); var total = Number(resp.total || resp.deals.length || 0); var pages = Number(resp.total_pages || Math.ceil(total / (per||10)) || 1); return { items: resp.deals, total: total, page: resp.page||1, pages: pages }; }
      return { items: [], total: 0, page: 1, pages: 1 };
    }
    function fetchAll(){
      var SB = window.SB; SB.limit = SB.limit>0 ? SB.limit : 24;
            // Query signature: reset renderedPageMax on q/category/sort change
      try {
        var _sig = String((SB.category||''))+'|'+String((SB.sort||''))+'|'+String((SB.q||SB.keyword||SB.search||''));
        if (SB.__sigPrev !== _sig) { SB.__sigPrev = _sig; SB.renderedPageMax = 0; SB.hasMore = true; try{ var s=document.getElementById('scroll-sentinel'); if(s) s.style.display=''; }catch(_e){} }
      } catch(_e) {}
var qs = 'page='+encodeURIComponent(SB.page)+'&limit='+encodeURIComponent(SB.limit)+'&category='+encodeURIComponent(SB.category||'')+'&sort='+encodeURIComponent(SB.sort||'heat')+'&q='+encodeURIComponent(SB.q || SB.keyword || SB.search || '')+'&status=approved';
      qs += '&location='+encodeURIComponent(SB.location||'');

      if (SB.lat!=null && SB.lon!=null) { qs += '&lat='+encodeURIComponent(SB.lat)+'&lon='+encodeURIComponent(SB.lon); }
      if (window.__sbFetchBusy || window.__sbLastQS === qs) return Promise.resolve(null);
      window.__sbFetchBusy = true;
      return fetchJSON('api/get_deals.php?'+qs)
        .then(function(dealsJson){
          var deals = (dealsJson && Array.isArray(dealsJson.items)) ? dealsJson.items : (dealsJson && Array.isArray(dealsJson.deals)) ? dealsJson.deals : [];
          var ids = deals.map(function(d){ return d.id; }).filter(Boolean).join(',');
          if (!ids){ var payload = { meta: dealsJson, deals: deals, countsById: {} }; window.__sbLastQS = qs; window.__sbLastResult = payload; return payload; }
          return fetchJSON('api/get_reports.php?ids='+ids)
            .then(function(data){
              var countsById = {}; var arr = (data && Array.isArray(data.counts)) ? data.counts : [];
              for (var i=0;i<arr.length;i++){ var row = arr[i]; var rid = row && row.id; if (rid == null) continue; countsById[String(rid)] = { upvotes: Number(row.upvotes || 0), downvotes: Number(row.downvotes || 0), reports: Number(row.reports || 0) }; }
              var payload = { meta: dealsJson, deals: deals, countsById: countsById }; window.__sbLastQS = qs; window.__sbLastResult = payload; return payload;
            })
            .catch(function(){ var payload = { meta: dealsJson, deals: deals, countsById: {} }; window.__sbLastQS = qs; window.__sbLastResult = payload; return payload; });
        })
        .catch(function(err){ console.error('[fetchAll] error', err); return { meta: { total: 0 }, deals: [], countsById: {} }; })
        .finally(function(){ window.__sbFetchBusy = false; });
    }
    function renderDeal(d, counts){
      var seen = getSeenDeals(); var createdAt = d.created_at || d.createdAt || d.created || ''; var isNewForUser = (!seen.has(String(d.id))) && isRecent(createdAt);
      var title = d.title || ''; var desc = snippet(d.summary || d.description); var username = d.username || 'Unknown'; var views = Number(d.views || 0); var price = (d.price && d.price !== '0.00') ? ('₹' + d.price) : ''; var city = d.location || '';
      var icPerson = '<svg class="ic ic-user" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4 20a8 8 0 0 1 16 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
      var icCheck  = '<svg class="ic ic-check" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M5 13l4 4 10-10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      var icStore  = '<svg class="ic ic-store" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M3 10l1-5h16l1 5M5 10v9h14v-9M9 19v-5h6v5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      var icEye    = '<svg class="ic ic-eye" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
      var pinned   = String(d.is_pinned||'0')==='1' ? '📌 ' : ''; var verified = Number(d.is_verified) === 1 ? '<span class="role-badge is-verified" title="Verified user">' + icCheck + '</span>' : ''; var vbiz = Number(d.is_verified_business) === 1 ? '<span class="role-badge is-biz" title="Verified business">' + icStore + '</span>' : '';
      var thumb    = pickThumb(d.thumbnail || d.image);
      var c = counts[String(d.id)] || {}; var upvoteCount = Number(c.upvotes || d.upvotes || 0); var downvoteCount = Number(c.downvotes || d.downvotes || 0);
      var score = heatScore(views, upvoteCount, downvoteCount);
      return ['<a href="deal.html?id=', String(d.id), '" class="deal-card">','<div class="heat-badge" style="background: conic-gradient(', heatColor(score), ' 0% ', String(score), '%, #f3f4f6 ', String(score), '%);"><span>', String(score), '</span></div>','<div class="deal-thumb">','<img loading="lazy" decoding="async" src="', (esc(d.image_url || '') || ((thumb && esc(thumb)) || 'default.jpg')), '" onerror="imgFallback(this)" data-title="', esc(title), '">','</div>','<div class="deal-content">','<h3 class="deal-title">', pinned, esc(title), (isNewForUser ? ' <span class="badge-new">NEW</span>' : ''), '</h3>',(desc ? '<p class="deal-description">' + esc(desc) + '</p>' : ''),'<div class="deal-meta">' + icPerson + ' ' + esc(username) + ' ' + verified + ' ' + vbiz + '</div>','<div class="deal-footer">','<div class="deal-meta-inline">',(price ? '<span>' + price + '</span>' : ''),(city ? '<span>' + esc(city) + '</span>' : ''),'</div>','<div class="metrics metrics--static">','<span class="metric"><svg class="ic" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M2 10h4v10H2zM8 21h7.2a3 3 0 0 0 2.94-2.46l1.18-7A3 3 0 0 0 16.37 8H13V5a3 3 0 0 0-3-3l-2 6v13z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg><span class="count">' + String(fmt(upvoteCount)) + '</span></span>','<span class="metric"><svg class="ic" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M22 14h-4V4h4zM16 3H8.8A3 3 0 0 0 5.86 5.46l-1.18 7A3 3 0 0 0 7.63 16H11v3a3 3 0 0 0 3 3l2-6V3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg><span class="count">' + String(fmt(downvoteCount)) + '</span></span>','<span class="metric">' + icEye + '<span class="count">' + String(fmt(views)) + '</span></span>','</div>','</div>','</div>','</a>'].join('');
    }
    function renderPagination(totalPages, current){
      var el = document.getElementById('pagination'); if (!el) return;
      totalPages = Number(totalPages || 1); current = Number(current || 1);
      if (totalPages <= 1){ el.innerHTML = ''; return; }
      var windowSize = 5; var start = Math.max(1, current - Math.floor(windowSize/2)); var end = Math.min(totalPages, start + windowSize - 1); start = Math.max(1, end - windowSize + 1);
      var html = ''; function btn(p, label, disabled, currentB){ label = (label==null? p : label); return '<button class="pg-btn ' + (currentB?'is-current':'') + '" data-page="' + p + '" ' + (disabled?'disabled':'') + '>' + label + '</button>'; }
      html += btn(1, '« First', current === 1, false); html += btn(Math.max(1, current - 1), '‹ Prev', current === 1, false); for (var i = start; i <= end; i++) html += btn(i, String(i), false, i === current); html += btn(Math.min(totalPages, current + 1), 'Next ›', current === totalPages, false); html += btn(totalPages, 'Last »', current === totalPages, false); el.innerHTML = html;
    }
    function renderList(payload, append){
      var dealsRaw = payload.meta || payload; var out = normDeals(dealsRaw); var items = out.items, page = out.page, pages = out.pages; var countsById = payload.countsById || {};
      try{
        var SB = window.SB || {}; var cat = (SB.category || '').toString().trim().toLowerCase();
        if (cat){
          items = items.filter(function(d){
            var c = ((d.category || d.tags || '') + '').toLowerCase();
            if (Array.isArray(d.tags)){ try{ if (d.tags.some(function(t){ return (t||'').toString().toLowerCase().indexOf(cat) >= 0; })) return true; }catch(e){} }
            return c.indexOf(cat) >= 0;
          });
        }
        function n(val){ var x = Number(val); return isFinite(x) ? x : 0; }
        function byDate(d){ var t = Date.parse(d.created_at || d.createdAt || d.created || 0); return isFinite(t) ? t : 0; }
        function byPrice(d){ var v = parseFloat(d.price); return isFinite(v) ? v : Number.POSITIVE_INFINITY; }
        function byViews(d){ return n(d.views || 0); }
        function byUp(d){ var id=String(d.id); var c=countsById[id]||{}; var up=(c.upvotes!=null)?c.upvotes:d.upvotes; return n(up||0); }
        function byHeat(d){ var id=String(d.id); var c=countsById[id]||{}; var up=(c.upvotes!=null)?c.upvotes:d.upvotes; var down=(c.downvotes!=null)?c.downvotes:d.downvotes; var v=d.views; var raw=(n(v)*0.4)+(n(up)*3)-(n(down)*4); return Math.max(0,Math.min(100,Math.round(raw/2))); }
        var sortKey = String((SB.sort||'heat')).toLowerCase();
        if (sortKey==='new' || sortKey==='newest' || sortKey==='created' || sortKey==='date'){ items.sort(function(a,b){ return byDate(b)-byDate(a); }); }
        else if (sortKey==='price'){ items.sort(function(a,b){ return byPrice(a)-byPrice(b); }); }
        else if (sortKey==='views'){ items.sort(function(a,b){ return byViews(b)-byViews(a); }); }
        else if (sortKey==='upvotes'){ items.sort(function(a,b){ return byUp(b)-byUp(a); }); }
        else { items.sort(function(a,b){ return byHeat(b)-byHeat(a); }); }
      }catch(e){ console.warn('client sort/filter failed', e); }
            // Read meta early and guard against stale renders (e.g., page=1 arriving after page=2)
      var _metaEarly = (dealsRaw && typeof dealsRaw==='object') ? dealsRaw : {};
      var _curEarly = Number(_metaEarly.page || 1);
      if (!append) {
        var _maxRendered = Number((window.SB && window.SB.renderedPageMax) || 0);
        if (_curEarly <= _maxRendered) { try{ console.debug('Skip stale render page', _curEarly, '≤', _maxRendered); }catch(_e){}; return; }
      }
if (!append) { dealList.innerHTML = ''; }
      if (items && items.length) {
        var html = items.map(function(d){ return renderDeal(d, countsById); }).join('');
        if (append) { dealList.insertAdjacentHTML('beforeend', html); }
        else { dealList.innerHTML = html; }
      } else if (!append) {
        dealList.innerHTML = '<p>No deals found.</p>';
      }
      // Apply title-initials placeholder for default images (safe position after if/else-if)
      try {
        var _imgs = dealList.querySelectorAll('.deal-thumb img');
        _imgs.forEach(function(im){
          var s = im.getAttribute('src') || '';
          if (!s || /\/default\.jpg$/i.test(s)) { imgFallback(im); }
        });
      } catch(_e) {}

      // Populate city suggestions from items
      try{
        var _dl = document.getElementById('city-suggestions'); if (_dl && items && items.length){
          var _seen = Object.create(null);
          items.forEach(function(d){ var c=(d && d.location||'').trim(); if(c && !_seen[c]){ _seen[c]=1; var o=document.createElement('option'); o.value=c; _dl.appendChild(o);} });
        }
      }catch(_e){}

      try {
        var meta = (dealsRaw && typeof dealsRaw==='object') ? dealsRaw : {};
        var totalPages = Number(meta.total_pages || meta.pages || Math.ceil((Number(meta.total||0)) / (Number(meta.per_page || (window.SB && window.SB.limit) || 24))) || 1);
        var cur = Number(meta.page || 1);
        window.SB.hasMore = (cur < totalPages);
        var pageSize = Number((meta && meta.per_page) || (window.SB && window.SB.limit) || 24);
        var got = (Array.isArray(items) ? items.length : 0);
        if (!window.SB.hasMore && got >= pageSize) window.SB.hasMore = true;
        if (!window.SB.hasMore) {
          var snt = document.getElementById('scroll-sentinel');
          if (snt) snt.style.display = 'none';
        }
        if (window.SB) { window.SB.renderedPageMax = Math.max(Number(window.SB.renderedPageMax||0), Number(cur||1)); }
        renderPagination(totalPages, cur);
      } catch(e) {}
}
    function boot(){ var append = (window.SB.__append === true); window.SB.__append = false; fetchAll().then(function(payload){ if (!payload || !payload.meta) return; renderList(payload, append); }).catch(function(err){ console.error('Error loading deals:', err); dealList.innerHTML = '<p>Error loading deals.</p>'; }); }
    window.boot = window.boot || boot;
    document.addEventListener('click', function(e){ var b = e.target.closest ? e.target.closest('.pg-btn[data-page]') : null; if (!b) return; var p = Number(b.getAttribute('data-page')); if (!isFinite(p)) return; window.SB.page = Math.max(1, p); window.SB.__append = false; boot(); });
    (function bindSearch(retries){ if (window.__sbSearchBound) return; var si = document.getElementById('deal-search'); if (!si){ if ((retries||0) < 30) return setTimeout(function(){ bindSearch((retries||0)+1); }, 100); else return; } window.__sbSearchBound = true; try{ if (typeof window.SB.q === 'string' && !si.value) si.value = window.SB.q; }catch(e){} var DEBOUNCE_MS=400, MIN_LEN=2, timer=null, lastSent=(typeof window.SB.q==='string')?window.SB.q:''; function fire(force){ var q = (si.value||'').trim(); if (!force){ if (q.length===0 && lastSent==='') return; if (q.length>0 && q.length<MIN_LEN) return; } if (q===lastSent) return; lastSent=q; window.SB.q=q; window.SB.keyword=q; window.SB.search=q; window.SB.page=1; window.SB.hasMore=true; window.SB.__append=false; window.__sbLastQS = null; window.__sbFetchBusy = false; boot(); } si.addEventListener('input', function(){ clearTimeout(timer); timer=setTimeout(function(){ fire(false); }, DEBOUNCE_MS); }); si.addEventListener('keydown', function(e){ if (e.key === 'Enter'){ clearTimeout(timer); fire(true); } }); })(0);
    (function setupInfiniteScroll(){ var sentinel = document.getElementById('scroll-sentinel'); if (!sentinel){ sentinel = document.createElement('div'); sentinel.id = 'scroll-sentinel'; sentinel.style.height='1px'; sentinel.style.width='100%'; var dl = document.getElementById('deal-list'); if (dl && dl.parentNode) dl.parentNode.insertBefore(sentinel, dl.nextSibling); } if (!('IntersectionObserver' in window)) return; var io = new IntersectionObserver(function(entries){ var e = entries[0]; if (!e || !e.isIntersecting) return; if (window.__sbFetchBusy) return; if (!window.SB.hasMore) return; window.SB.page = (window.SB.page||1)+1; window.SB.__append = true; window.__sbLastQS = null; window.__sbFetchBusy = false; boot(); }, { root:null, rootMargin:'600px', threshold:0 }); io.observe(sentinel); })();
    window.addEventListener('pageshow', function(){ try{ if (document.getElementById('deal-list')) 
// Location Apply ↔ Clear toggle (single-button)
(function(){
  var SB = window.SB || (window.SB = {});
  var inLoc = document.getElementById('location-input') || document.getElementById('city-input');
  var btn   = document.getElementById('btn-apply-location') || document.getElementById('btn-apply-city');
  var btnUse= document.getElementById('btn-use-location');
  if (!inLoc || !btn) return;

  try {
    var geoLS = JSON.parse(localStorage.getItem('sb_geo') || 'null');
    if (geoLS && typeof geoLS.lat === 'number' && typeof geoLS.lon === 'number') {
      SB.lat = geoLS.lat; SB.lon = geoLS.lon;
    }
  } catch(_) {}

  function isActive(){ return !!(SB.location && SB.location.trim()); }
  function setMode(){
    if (isActive()){
      btn.textContent = 'Clear';
      btn.title = 'Reset location filter';
      btn.dataset.mode = 'clear';
      btn.classList.add('is-active');
      if (!inLoc.value) inLoc.value = SB.location;
    } else {
      btn.textContent = 'Apply';
      btn.title = 'Apply location filter';
      btn.dataset.mode = 'apply';
      btn.classList.remove('is-active');
    }
  }

  inLoc.addEventListener('input', setMode);

  btn.addEventListener('click', function(){ if (btn.dataset.mode === 'clear'){
      inLoc.value = '';
      SB.location = '';
      SB.lat = null; SB.lon = null;
      try { localStorage.removeItem('sb_geo'); } catch(_) {}
      // Reset pagination & infinite scroll state
      SB.page = 1; SB.__append = false; SB.renderedPageMax = 0; SB.hasMore = true;
      try { var s = document.getElementById('scroll-sentinel'); if (s) s.style.display = ''; } catch(_e){}
      // Reset fetch throttle so next loads proceed
      window.__sbLastQS = null; window.__sbFetchBusy = false;
      (window.safeBoot || window.boot)();
      setMode();
      return;
    }
    // Apply
    SB.location = (inLoc.value || '').trim();
    SB.page = 1; SB.__append = false; SB.renderedPageMax = 0;
    window.__sbLastQS = null; (window.safeBoot || window.boot)();
    setMode();
  });

  if (btnUse){
    btnUse.addEventListener('click', function(){
      if (!navigator.geolocation){ alert('Geolocation not supported'); return; }
      navigator.geolocation.getCurrentPosition(function(pos){
        SB.lat = pos.coords.latitude; SB.lon = pos.coords.longitude;
        try { localStorage.setItem('sb_geo', JSON.stringify({lat:SB.lat, lon:SB.lon})); } catch(_) {}
        SB.page = 1; SB.__append = false; SB.renderedPageMax = 0;
        window.__sbLastQS = null; (window.safeBoot || window.boot)();
        setMode();
      }, function(err){ console.warn('Geo denied', err); alert('Location blocked. Type your city instead.'); });
    });
  }

  setMode();
})();
boot(); }catch(e){} });
    
      /* Fallback UI bindings for search/category/sort */
      (function(){
        if (window.__sbFallbackBound) return; window.__sbFallbackBound = true;
        var SB = window.SB || (window.SB = {page:1,limit:24,category:'',sort:'heat',q:''});
        // Search input fallback
        var si = document.getElementById('deal-search');
        if (si){
          var deb=null; si.addEventListener('input', function(){
            clearTimeout(deb); var v=(si.value||'').trim();
            deb=setTimeout(function(){ SB.q=v; SB.page=1; SB.__append=false; SB.hasMore=true; SB.renderedPageMax=0; try{ var __s=document.getElementById('scroll-sentinel'); if(__s) __s.style.display=''; }catch(_e){}; window.__sbLastQS=null; (window.safeBoot||window.boot)(); }, 250);
          });
        }
        // Toolbar fallback (tabs/selects)
        var bar = document.getElementById('deals-toolbar');
        if (bar){
          bar.addEventListener('click', function(ev){ var t=ev.target; if(!t) return; if(t.matches('.tab')){ SB.category=t.getAttribute('data-cat')||''; SB.page=1; SB.__append=false; SB.hasMore=true; SB.renderedPageMax=0; try{ var __s=document.getElementById('scroll-sentinel'); if(__s) __s.style.display=''; }catch(_e){}; window.__sbLastQS=null; (window.safeBoot||window.boot)(); }});
          var catSel = bar.querySelector('#sb-cat'); if (catSel){ catSel.addEventListener('change', function(){ SB.category=catSel.value||''; SB.page=1; SB.__append=false; SB.hasMore=true; SB.renderedPageMax=0; try{ var __s=document.getElementById('scroll-sentinel'); if(__s) __s.style.display=''; }catch(_e){}; window.__sbLastQS=null; (window.safeBoot||window.boot)(); }); }
          var sortSel = bar.querySelector('#sb-sort'); if (sortSel){ sortSel.addEventListener('change', function(){ SB.sort=sortSel.value||'heat'; SB.page=1; SB.__append=false; SB.hasMore=true; SB.renderedPageMax=0; try{ var __s=document.getElementById('scroll-sentinel'); if(__s) __s.style.display=''; }catch(_e){}; window.__sbLastQS=null; (window.safeBoot||window.boot)(); }); }
        }
      })();

      // Location controls wiring
      try{
        var geoLS = null; try{ geoLS = JSON.parse(localStorage.getItem('sb_geo')||'null'); }catch(__){}
        if (geoLS && typeof geoLS.lat==='number' && typeof geoLS.lon==='number') { SB.lat=geoLS.lat; SB.lon=geoLS.lon; }
        var btnApply = document.getElementById('btn-apply-city');
        var inCity = document.getElementById('city-input');
        var btnUse = document.getElementById('btn-use-location');
        if (btnApply && inCity){ btnApply.addEventListener('click', function(){ SB.location=(inCity.value||'').trim(); SB.page=1; SB.__append=false; SB.renderedPageMax=0; window.__sbLastQS=null; (window.safeBoot||window.boot)(); }); }
        if (inCity){ inCity.addEventListener('keydown', function(ev){ if(ev.key==='Enter'){ ev.preventDefault(); btnApply && btnApply.click(); }}); }
        if (btnUse){ btnUse.addEventListener('click', function(){
          if (!navigator.geolocation){ alert('Geolocation not supported'); return; }
          navigator.geolocation.getCurrentPosition(function(pos){ SB.lat=pos.coords.latitude; SB.lon=pos.coords.longitude; try{ localStorage.setItem('sb_geo', JSON.stringify({lat:SB.lat,lon:SB.lon})); }catch(e){}
            SB.page=1; SB.__append=false; SB.renderedPageMax=0; window.__sbLastQS=null; (window.safeBoot||window.boot)();
          }, function(err){ console.warn('Geo denied', err); alert('Location blocked. Type your city instead.'); });
        }); }
      }catch(e){}

      /* removed old location wiring */
  });
})(); 

/* SB_BOOT_SAFETY */
try{
  window.addEventListener('load', function(){ try{ if (document.getElementById('deal-list')) (window.safeBoot||window.boot)(); }catch(_e){} });
  window.addEventListener('pageshow', function(){ try{ if (document.getElementById('deal-list')) (window.safeBoot||window.boot)(); }catch(_e){} });
}catch(_e){}