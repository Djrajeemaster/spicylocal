
// theme.js — apply global theme color; show picker only for super_admin
(function(){
  async function getProfile(){
    try{ const r = await fetch('/bagit/api/auth/profile.php',{credentials:'include', cache:'no-store'});
         return await r.json(); }catch(e){ return {}; }
  }
  async function loadTheme(){
    try{ const r = await fetch('/bagit/api/theme_get.php',{cache:'no-store'});
         if(!r.ok) throw 0; return await r.json(); }catch(e){ return { color: getComputedStyle(document.documentElement).getPropertyValue('--sb-accent')||'#ff007a' }; }
  }
  function apply(color){
    if(!color) return;
    document.documentElement.style.setProperty('--sb-accent', color);
  }
  function mountPicker(color){
    if (document.getElementById('sb-theme-picker')) return;
    const wrap = document.createElement('div');
    wrap.id = 'sb-theme-picker';
    wrap.style.cssText = 'position:fixed;right:14px;bottom:14px;background:#fff;padding:10px 12px;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,.08);z-index:9999;display:flex;gap:8px;align-items:center';
    wrap.innerHTML = '<span style="font:600 12px system-ui">Theme</span><input type="color" id="sbThemePicker" aria-label="Theme color"><button id="sbThemeSave" class="button" style="padding:6px 10px;border-radius:8px;">Save</button>';
    document.body.appendChild(wrap);
    const inp = wrap.querySelector('#sbThemePicker');
    const btn = wrap.querySelector('#sbThemeSave');
    inp.value = (String(color||'#ff007a').trim().match(/^#[0-9A-Fa-f]{6}$/) ? color : '#ff007a');
    inp.addEventListener('input', e => apply(e.target.value));
    btn.addEventListener('click', async () => {
      const c = inp.value;
      try{
        await fetch('/bagit/api/theme_set.php',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ color: c })});
      }catch{}
    });
  }
  document.addEventListener('DOMContentLoaded', async () => {
    const theme = await loadTheme();
    apply(theme.color);
    const me = await getProfile();
    const force = new URLSearchParams(location.search).has('forceTheme');
    if (force || (me && me.role === 'super_admin')) {
      mountPicker(theme.color);
    }
  });
})();