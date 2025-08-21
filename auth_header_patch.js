// auth_header_patch.js — safe, additive header fix (no overwrite)
// Guards so it won't double-install if included twice.
(function(){
  if (window.__SB_AUTH_PATCH__) return;
  window.__SB_AUTH_PATCH__ = true;

  function setAuthUI(user){
    const showAuth = !!(user && user.ok);
    document.querySelectorAll('.auth-only, .user-menu').forEach(el =>
      el.classList.toggle('hidden', !showAuth)
    );
    document.querySelectorAll('.guest-only, .login-link').forEach(el =>
      el.classList.toggle('hidden', showAuth)
    );
    const initials = showAuth && user.username
      ? user.username.trim().slice(0,2).toUpperCase()
      : '';
    document.querySelectorAll('.user-icon, .avatar, .user-initials').forEach(el => el.textContent = initials);
    document.querySelectorAll('.username-label, .user-name').forEach(el => el.textContent = showAuth ? (user.username||'') : '');
  }

  async function refreshHeaderAuth(){
    try {
      const r = await fetch('api/me.php', { credentials:'include', cache:'no-store' });
      const tx = await r.text();
      const me = JSON.parse(tx);
      if (!r.ok || !me.ok) throw 0;
      setAuthUI(me);
    } catch {
      localStorage.removeItem('user_id');
      localStorage.removeItem('username');
      setAuthUI(null);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setAuthUI(null);
    refreshHeaderAuth();
  });

  window.addEventListener('pageshow', (e) => {
    if (e.persisted) refreshHeaderAuth();
  });

  async function performLogout(){
    try { await fetch('api/logout.php', { credentials:'include', cache:'no-store' }); } catch {}
    localStorage.clear();
    setAuthUI(null);
    location.replace('login.html');
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('#logout, .logout-link, a[href*="logout"]');
    if (!a) return;
    e.preventDefault();
    performLogout();
  });
})();
