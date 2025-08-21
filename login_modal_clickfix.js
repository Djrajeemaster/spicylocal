// login_modal_clickfix.js — makes the modal buttons always work (capture-phase delegation)
(function(){
  if (window.__LOGIN_CLICKFIX_INSTALLED__) return;
  window.__LOGIN_CLICKFIX_INSTALLED__ = true;

  function hideOverlay(){
    var ov = document.getElementById('sb-login-overlay');
    if (ov) ov.style.display = 'none';
    try { document.body.style.overflow = ''; } catch(e){}
  }

  // Ensure only one overlay exists (defensive, in case of duplicate inserts)
  function dedupeOverlay(){
    var nodes = document.querySelectorAll('#sb-login-overlay');
    if (nodes.length > 1) {
      for (var i = 1; i < nodes.length; i++) { try { nodes[i].remove(); } catch(e){} }
    }
  }

  // Capture-phase so no other handler can block these actions
  document.addEventListener('click', function(ev){
    dedupeOverlay();
    var t = ev.target;
    if (!t) return;

    // Backdrop click closes
    var ov = document.getElementById('sb-login-overlay');
    if (ov && t === ov) {
      ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
      hideOverlay(); return;
    }

    // Button clicks
    var id = t.id || '';
    if (id === 'sb-login-cancel') {
      ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
      hideOverlay(); return;
    }
    if (id === 'sb-login-go') {
      ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
      // navigate to login with return URL
      try {
        location.href = './login.php?next=' + encodeURIComponent(location.href);
      } catch(e){}
      return;
    }
  }, true);
})();
