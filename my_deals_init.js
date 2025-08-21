// my_deals_init.js
// Usage: call initDealsSection('my'|'top'|'popular', mountSelector)
(function(){
  async function fetchDeals(section){
    const loc = localStorage.getItem('primaryLocation') || '';
    const url = `/bagit/api/deals_feed.php?section=${encodeURIComponent(section)}&location=${encodeURIComponent(loc)}`;
    const res = await fetch(url, { credentials: 'include' });
    if(!res.ok) throw new Error('fetch_failed');
    return res.json();
  }
  function render(list, mount){
    mount.innerHTML = '';
    list.forEach(d => {
      const card = document.createElement('div');
      card.className = 'deal-card';
      card.innerHTML = `<div class="deal">
        <img src="${d.image || '/bagit/assets/img/default_deal.png'}" alt="">
        <div class="info">
          <h3>${d.title || 'Deal'}</h3>
          <div class="muted">${d.category || ''} • ${d.city || ''}</div>
        </div>
      </div>`;
      mount.appendChild(card);
    });
  }
  window.initDealsSection = async function(section, mountSelector){
    const mount = document.querySelector(mountSelector);
    if(!mount) return;
    const data = await fetchDeals(section);
    if(data.ok) render(data.deals || [], mount);

    document.addEventListener('locationChanged', async (e) => {
      const updated = await fetchDeals(section);
      if(updated.ok) render(updated.deals || [], mount);
    });
  };
})();