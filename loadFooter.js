// loadFooter.js — mounts footer once
(function(){
  const FOOT_ATTR = "data-footer-mounted";
  if (document.body.getAttribute(FOOT_ATTR) === "1") return;
  async function init(){
    try{
      const r = await fetch('/bagit/footer.html', {cache:'no-store'});
      const html = await r.text();
      const mountPoint = document.getElementById('global-footer');
      if (mountPoint) mountPoint.innerHTML = html; else document.body.insertAdjacentHTML('beforeend', html);
      document.body.setAttribute(FOOT_ATTR, "1");

      try{
        const fr = await fetch('/bagit/api/feature_flags.php', {cache:'no-store'});
        const flags = await fr.json();
        if (!flags.leaderboard) {
          const lb = document.querySelector('[data-ff="leaderboard"]');
          if (lb && lb.parentNode) lb.parentNode.removeChild(lb);
        }
      }catch(_e){ /* ignore */ }
    
    }catch(e){}
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
