// login_modal_guard.js — standalone guest guard + modal (no external CSS)
(function(){
  if (window.__LOGIN_GUARD_INSTALLED__) return;
  window.__LOGIN_GUARD_INSTALLED__ = true;

  function ensureLoginModal(){
    if (document.getElementById('sb-login-overlay')) return;

    // Overlay
    var ov = document.createElement('div');
    ov.id = 'sb-login-overlay';
    ov.setAttribute('role','presentation');
    ov.style.position = 'fixed';
    ov.style.inset = '0';
    ov.style.display = 'none';
    ov.style.alignItems = 'center';
    ov.style.justifyContent = 'center';
    ov.style.background = 'rgba(0,0,0,.45)';
    ov.style.zIndex = '9999';

    // Modal
    var modal = document.createElement('div');
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-labelledby','sb-login-title');
    modal.style.background = '#fff';
    modal.style.width = 'min(92vw, 420px)';
    modal.style.borderRadius = '14px';
    modal.style.boxShadow = '0 12px 30px rgba(0,0,0,.18)';
    modal.style.padding = '20px';
    modal.style.fontFamily = 'system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif';
    modal.style.lineHeight = '1.45';

    var h3 = document.createElement('h3');
    h3.id = 'sb-login-title';
    h3.textContent = 'Login required';
    h3.style.margin = '0 0 8px';
    h3.style.fontSize = '18px';
    h3.style.color = '#111827';

    var p = document.createElement('p');
    p.id = 'sb-login-msg';
    p.textContent = 'You need to log in to continue.';
    p.style.margin = '0 0 16px';
    p.style.color = '#4b5563';

    var actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';
    actions.style.justifyContent = 'flex-end';

    function styleBtn(btn, primary){
      btn.style.appearance = 'none';
      btn.style.border = '0';
      btn.style.padding = '10px 14px';
      btn.style.borderRadius = '10px';
      btn.style.fontWeight = '600';
      btn.style.cursor = 'pointer';
      if(primary){
        btn.style.background = '#2563eb'; btn.style.color = '#fff';
      } else {
        btn.style.background = '#f3f4f6'; btn.style.color = '#111827';
      }
    }

    var cancel = document.createElement('button');
    cancel.type = 'button'; cancel.id = 'sb-login-cancel'; cancel.textContent = 'Close';
    styleBtn(cancel, false);

    var go = document.createElement('button');
    go.type = 'button'; go.id = 'sb-login-go'; go.textContent = 'Log in';
    styleBtn(go, true);

    actions.appendChild(cancel); actions.appendChild(go);
    modal.appendChild(h3); modal.appendChild(p); modal.appendChild(actions);
    ov.appendChild(modal); document.body.appendChild(ov);
  }

  function showLoginModal(action){
    ensureLoginModal();
    var ov = document.getElementById('sb-login-overlay');
    var msg = document.getElementById('sb-login-msg');
    if (msg) msg.textContent = 'You need to log in to ' + (action||'use this feature') + '.';

    ov.style.display = 'flex';
    var prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    var cancel = document.getElementById('sb-login-cancel');
    var go = document.getElementById('sb-login-go');

    function cleanup(){
      ov.style.display = 'none';
      document.body.style.overflow = prevOverflow || '';
      if (cancel) cancel.removeEventListener('click', onCancel, true);
      if (go) go.removeEventListener('click', onGo, true);
      ov.removeEventListener('click', onBackdrop, true);
      document.removeEventListener('keydown', onKey, true);
    }
    function onCancel(ev){ ev.preventDefault(); cleanup(); }
    function onGo(ev){
      ev.preventDefault();
      location.href = './login.php?next=' + encodeURIComponent(location.href);
    }
    function onBackdrop(ev){ if (ev.target === ov) { cleanup(); } }
    function onKey(ev){ if (ev.key === 'Escape') { cleanup(); } }

    if (cancel) cancel.addEventListener('click', onCancel, true);
    if (go) go.addEventListener('click', onGo, true);
    ov.addEventListener('click', onBackdrop, true);
    document.addEventListener('keydown', onKey, true);

    try { if (go) go.focus(); } catch(e){}
  }

  // Public API (only define if not present)
  if (!window.promptLogin) {
    window.promptLogin = (function(){
      var lock = false;
      return function(action){
        if (lock) return;
        lock = true;
        showLoginModal(action);
        setTimeout(function(){ lock = false; }, 350);
      };
    })();
  }

  // Capture-phase guard
  document.addEventListener('click', function(ev){
    try{
      var t = ev.target && ev.target.closest ? ev.target.closest('[data-requires-login]') : null;
      if(!t || window.__IS_LOGGED_IN__) return;
      ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
      var act = t.getAttribute('data-login-action') || 'use this feature';
      window.promptLogin(act);
      if (document.activeElement) { try { document.activeElement.blur(); } catch(e){} }
    }catch(e){}
  }, true);

  // Tag and configure elements once DOM is ready
  function tagElements(){
    var ids = ['#btn-up','#btn-down','#cnt-up','#cnt-down','#comment-send','#comment-text'];
    var els = ids.map(function(sel){ return document.querySelector(sel); });
    var up=els[0], down=els[1], cu=els[2], cd=els[3], send=els[4], ta=els[5];
    [up,down,cu,cd,send,ta].forEach(function(el){ if(!el) return; el.setAttribute('data-requires-login','1'); });
    [up,down,cu,cd].forEach(function(el){ if(!el) return; el.setAttribute('data-login-action','vote'); });
    if (send) send.setAttribute('data-login-action','comment');
    if (ta){
      ta.setAttribute('data-login-action','comment');
      if (!window.__IS_LOGGED_IN__) {
        ta.readOnly = true;
        ta.placeholder = 'Log in to comment';
        ta.style.background = '#f9fafb'; ta.style.cursor = 'not-allowed'; ta.style.opacity = '.85';
      }
    }
  }

  async function detectLogin(){
  try{
    var u = localStorage.getItem('username') || localStorage.getItem('user') || localStorage.getItem('auth_user') || '';
    window.__IS_LOGGED_IN__ = !!u;
  }catch(e){ window.__IS_LOGGED_IN__ = false; }
}

  function init(){
    detectLogin().then(tagElements);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else {
    init();
  }

})();
