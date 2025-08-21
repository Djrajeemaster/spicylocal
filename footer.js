/* Global Footer Injector — SpicyBeats
   - Ensures ONLY one footer exists
   - Adds: © 2025 SpicyBeats. All rights reserved. | Terms | Privacy | Contact
   - Theme-friendly; uses existing site fonts/colors
*/
(function(){'use strict';
  function killLegacy(){
    try{
      // Remove obvious legacy footers that render duplicates
      var nodes = Array.from(document.querySelectorAll('footer, .site-footer, #footer'));
      nodes.forEach(function(n){
        var t = (n.textContent||'').toLowerCase();
        if (t.includes('©') && (t.includes('bagit') || t.includes('about · terms'))) {
          n.parentNode && n.parentNode.removeChild(n);
        }
      });
    }catch(e){}
  }

  function buildFooter(){
    var f = document.createElement('footer');
    f.className = 'sb-footer';
    f.innerHTML = `
      <div class="sb-footer-wrap">
        <div class="sb-footer-copy">© 2025 SpicyBeats. All rights reserved.</div>
        <nav class="sb-footer-links">
          <a href="terms.html">Terms</a>
          <span class="sep">|</span>
          <a href="privacy.html">Privacy</a>
          <span class="sep">|</span>
          <a href="contact.html">Contact</a>
        </nav>
      </div>
    `;
    // minimal styles inline to avoid new CSS files; plays nice with existing theme
    var css = document.createElement('style');
    css.textContent = `
      .sb-footer{background:#f7f7f8; border-top:1px solid #eee; margin-top:32px;}
      .sb-footer-wrap{max-width:1100px; margin:0 auto; padding:14px 12px; display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap; font-size:14px; color:#374151;}
      .sb-footer a{text-decoration:none;}
      .sb-footer a:hover{text-decoration:underline;}
      .sb-footer .sep{opacity:.5; margin:0 8px;}
      @media (max-width:600px){ .sb-footer-wrap{flex-direction:column; align-items:flex-start; gap:6px;} }
      /* respect site accent if defined */
      :root { --sb-accent: var(--primary, #e91e63); }
      .sb-footer a{ color: var(--sb-accent); }
    `;
    return { f, css };
  }

  function inject(){
    killLegacy();
    // If a modern footer already exists, skip
    if (document.querySelector('.sb-footer')) return;
    var target = document.querySelector('#footer') || document.body;
    var { f, css } = buildFooter();
    document.head.appendChild(css);
    target.appendChild(f);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();
