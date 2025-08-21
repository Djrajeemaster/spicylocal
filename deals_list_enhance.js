
// Lightweight image placeholder (inline SVG) — no external assets
(function(){
  if (window.imgFallback) return;
  window.imgFallback = function(img){
    if(!img || img.dataset.fallbackApplied) return;
    img.dataset.fallbackApplied = "1";
    var label = (img.getAttribute('data-title') || img.alt || 'Deal').slice(0,2).toUpperCase();
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90">'
            + '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
            + '<stop offset="0" stop-color="#e5e7eb"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs>'
            + '<rect width="100%" height="100%" fill="url(#g)"/>'
            + '<text x="50%" y="55%" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,Roboto,Arial"'
            + ' font-weight="700" font-size="40" fill="#111827">' + label + '</text></svg>';
    img.src = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
    img.classList.add("thumb--placeholder");
  };
})();
// Non-destructive Deal List Enhancements (runs only if #deal-list exists)
(function(ns){
  if (ns._installed) return; ns._installed = true;
  const listEl = document.getElementById('deal-list');
  if(!listEl) return;

  let state = { page:1, limit:10, category:'', sort:'heat', q:'' };

  function fetchDeals(){
    const qs = new URLSearchParams({page:state.page, limit:state.limit, category:state.category, sort:state.sort, q:state.q, status:'approved'});
    return fetch(`api/get_deals.php?${qs}`).then(r=>r.json());
  }
  function normalize(d){ if(Array.isArray(d)) return {items:d,total:d.length,page:1,pages:1}; if(d&&Array.isArray(d.items)) return d; return {items:[],total:0,page:1,pages:1}; }
  function esc(s){ return (''+(s||'')).replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }
  function fmt(n){ n=Number(n||0); return n>=1000?(n/1000).toFixed(1)+'k':n; }
  function heatWidthFromViews(v){ v=Number(v||0); return Math.max(2, Math.min(100, (v/(v+50))*100)); }
  function renderDeal(d){
    const thumb = d.thumbnail && String(d.thumbnail).trim() ? d.thumbnail : (d.image||'uploads/default.jpg');
    const price = d.price && d.price !== '0.00' ? `₹${d.price}` : '';
    const username = d.username ? `👤 ${esc(d.username)} · ` : '';
    const city = d.city || d.location || '';
    const pinned = String(d.is_pinned||'0') === '1' ? '📌 ' : '';
    const v1 = String(d.is_verified||'0') === '1' ? '<span class="chip chip-green">Verified</span>' : '';
    const v2 = String(d.is_verified_business||'0') === '1' ? '<span class="chip chip-blue">Verified Business</span>' : '';
    const views = Number(d.views||0);
    const title = esc(d.title||'');

    return `<a class="deal-card" href="deal.html?id=${d.id}">
      <div class="deal-body">
        <div class="deal-text">
          <h3>${pinned}${title}</h3>
          <div class="meta">${username}👁 ${fmt(views)}${price ? ' · '+price : ''}${city ? ' · '+esc(city) : ''}</div>
          <div class="chips">${v1}${v2}</div>
          <div class="heat"><span style="width:${heatWidthFromViews(views)}%"></span></div>
          <div class="counters">👍 — · 🚫 —</div>
        </div>
        <div class="deal-thumb"><img loading="lazy" data-src="${thumb}" onerror="imgFallback(this)" data-title="${title}" alt="Deal: ${title}"></div>
      </div>
    </a>`;
  }
  function render(raw){
    const data = normalize(raw);
    listEl.innerHTML = data.items.map(renderDeal).join('') || '<p>No deals found.</p>';
    const io = new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ const img=e.target; img.onerror = function(){ imgFallback(img); }; img.src = img.dataset.src; io.unobserve(img);} }),{rootMargin:'200px'});
    listEl.querySelectorAll('img[data-src]').forEach(img=>io.observe(img));

    const pager = document.getElementById('pager');
    if (pager){
      const info = document.getElementById('page-info');
      if (info) info.textContent = `Page ${data.page} / ${data.pages}`;
      const prev = pager.querySelector('[data-nav="prev"]');
      const next = pager.querySelector('[data-nav="next"]');
      if (prev) prev.disabled = state.page<=1;
      if (next) next.disabled = state.page>=data.pages;
    }
  }
  document.getElementById('sort-select')?.addEventListener('change', e=>{ state.sort=e.target.value; state.page=1; start(); });
  document.getElementById('deal-search')?.addEventListener('input', e=>{ clearTimeout(ns._q); ns._q=setTimeout(()=>{ state.q=e.target.value.trim(); state.page=1; start(); }, 300); });
  document.querySelector('#pager [data-nav="prev"]')?.addEventListener('click', ()=>{ if(state.page>1){ state.page--; start(); }});
  document.querySelector('#pager [data-nav="next"]')?.addEventListener('click', ()=>{ state.page++; start(); });
  function start(){ fetchDeals().then(render).catch(err=>{ console.error('Deals load failed', err); listEl.innerHTML = '<p>Failed to load deals.</p>'; }); }
  start();
})(window.SBListEnh || (window.SBListEnh = {}));
