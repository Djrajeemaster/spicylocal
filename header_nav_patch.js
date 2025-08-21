
/*! header_nav_patch.js — force-inject MyDeals/UpDeals/PopularDeals after header mounts (no reload) */
(function(){
  if (window.__SB_NAV_PATCH__) return; window.__SB_NAV_PATCH__ = true;

  function injectIntoNav(navEl){
    if(!navEl) return;
    const labels = Array.from(navEl.querySelectorAll('a')).map(a => (a.textContent||'').trim().toLowerCase());
    function add(label){
      if(labels.includes(label.toLowerCase())) return;
      const a = document.createElement('a');
      a.href = '#';
      a.className = navEl.classList.contains('gh-nav') ? 'gh-link' : 'nav-link';
      a.textContent = label;
      a.addEventListener('click', function(e){
        e.preventDefault();
        try{ window.dispatchEvent(new CustomEvent('sb:filter', { detail: { type: label.toLowerCase() } })); }catch(_){}
      });
      navEl.appendChild(a);
    }
    add('MyDeals'); add('UpDeals'); add('PopularDeals');
  }

  function tryInject(){
    var gh = document.querySelector('#global-header .gh-nav');
    if(gh){ injectIntoNav(gh); return true; }
    var legacy = document.getElementById('nav-menu');
    if(legacy){ injectIntoNav(legacy); return true; }
    return false;
  }

  // First try now
  if(tryInject()) return;

  // Observe header container for dynamic render
  var container = document.getElementById('global-header') || document.getElementById('sb-header') || document.body;
  var mo = new MutationObserver(function(){
    if(tryInject()){ mo.disconnect(); }
  });
  mo.observe(container, { childList: true, subtree: true });

  // Safety: run again after DOMContentLoaded
  document.addEventListener('DOMContentLoaded', tryInject);
})();
