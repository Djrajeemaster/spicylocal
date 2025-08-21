/* loadHeader.js — absolute /bagit/ base; BOM/backslash cleanup */

// loadHeader.js — clean, scoped, role-aware (ABSOLUTE-PATHS FIX)
(function () {
  const HEADER_MOUNTED_ATTR = "data-header-mounted";
  const BASE = "/bagit/"; // force absolute root so admin pages don't 404

  // Globals for translations and flags
  let featureFlags = {};
  let TR = {};
  const t = (k) => (TR && TR[k]) || k;

  function isTrue(v) { return v === "1" || v === "true"; }
  function byId(id) { return document.getElementById(id); }

  // --- Mount + Sanitize ------------------------------------------------------
  function sanitizeGlobalHeader(){
    const mount = document.getElementById('global-header');
    const hdr = document.getElementById('sb-header');
    if (!mount) return;

    // Remove any direct children of #global-header that are not the real header
    [...mount.children].forEach(ch => {
      if (hdr && ch !== hdr && ch.nodeType === 1) ch.remove();
    });

    // Remove any stray <a>Login</a> directly under #global-header
    mount.querySelectorAll(':scope > a').forEach(a => {
      const txt = (a.textContent||'').trim().toLowerCase();
      if (txt === 'login' || a.classList.contains('login-link')) a.remove();
    });
  }

  function mountHeader(html) { /* RELOCATE_IF_SCROLL_PRISON */
  try {
    var mount = document.getElementById('global-header');
    if (mount && mount.parentElement && getComputedStyle(mount.parentElement).overflow !== 'visible') {
      document.body.insertBefore(mount, document.body.firstChild);
    }
  } catch(e){}

    const mountPoint = document.getElementById("global-header");
    if (mountPoint) {
      mountPoint.innerHTML = html;
    } else {
      document.body.insertAdjacentHTML("afterbegin", html);
    }
    document.body.setAttribute(HEADER_MOUNTED_ATTR, "1"); window.__SB_HEADER_MOUNTED__=true;
    sanitizeGlobalHeader();
  }

  // --- Helpers ---------------------------------------------------------------
  function isAuthPage() {
    const p = location.pathname.toLowerCase();
    return p.endsWith('/login.html')
        || p.endsWith('/signup.html')
        || p.endsWith('/register.php')
        || p.endsWith('/login.php');
  }

  function normalizeHeaderDom(){
    const header = byId('sb-header');
    if (!header) return;
    const um = byId('user-menu');
    const btn = byId('user-menu-toggle');
    const dd  = byId('user-dropdown');
    const av  = byId('user-avatar');

    // Ensure dropdown under user-menu
    if (dd && um && dd.parentElement !== um) um.appendChild(dd);
    // Ensure avatar inside the button (first child)
    if (av && btn && av.parentElement !== btn) btn.insertBefore(av, btn.firstChild);

    // Remove legacy elems not part of new header
    const ghost = byId('user-icon'); // old inline loader artifact
    if (ghost && ghost !== av) ghost.remove();
  }

  function cleanupStrays(){
    const header = byId('sb-header');
    // Remove stray Login anchors outside header
    document.querySelectorAll('a').forEach(a=>{
      const txt = (a.textContent||'').trim().toLowerCase();
      const href = (a.getAttribute('href')||'').toLowerCase();
      const insideHeader = header && header.contains(a);
      const isLoginLink = txt === 'login'
        || a.classList.contains('login-link')
        || href.endsWith('login.html')
        || href.endsWith('login.php');
      if (!insideHeader && isLoginLink) a.remove();
    });
    // Remove legacy dropdowns not in header
    document.querySelectorAll('#user-icon, .dropdown').forEach(el=>{
      if (!header || !header.contains(el)) el.remove();
    });
  }

  
function buildGuestNav() {
    const nav = byId('nav-menu');
    if (!nav) return;
    // SB mockup start
    nav.innerHTML = [
      `<a href="${BASE}submit_deal.html" class="sb-link">+ Post Deal</a>`,
      `<a href="${BASE}smart_alerts.html" class="sb-link">Alerts</a>`
    ].join('');
    // SB mockup end

    // Show user icon with Login/Signup dropdown
    const um = byId('user-menu');
    if (um) {
      um.classList.remove('hidden');
      const nameLbl = um.querySelector('.username-label');
      if (nameLbl) nameLbl.textContent = '';
      const avatar = um.querySelector('#user-avatar');
      if (avatar) { avatar.textContent = '👤'; avatar.classList.add('guest'); }
      const dd = byId('user-dropdown');
      if (dd) {
        dd.innerHTML = [
          `<a href="${BASE}login.php" id="dd-login" role="menuitem">Login</a>`,
          `<a href="${BASE}signup.html" id="dd-signup" role="menuitem">Signup</a>`
        ].join('');
      }
      const btn = byId('user-menu-toggle');
      if (btn) btn.setAttribute('aria-label', 'User menu');
    }
  }


  
function buildAuthedNav(me) {
    const nav = byId('nav-menu');
    if (!nav) return;

    // SB mockup start
    const links = [];
    const isMuted = localStorage.getItem('is_muted') === '1';
    if (!isMuted) links.push(`<a href="${BASE}submit_deal.html" class="sb-link">+ Post Deal</a>`);
    links.push(`<a href="${BASE}smart_alerts.html" class="sb-link">Alerts</a>`);
    nav.innerHTML = links.join('');
    // SB mockup end


    // user menu visible
    const um = byId('user-menu');
    if (um) um.classList.remove('hidden');

    // initials + name
    const initials = (me.username||'').trim().slice(0,2).toUpperCase() || 'SB';
    const av = byId('user-avatar');
    if (av) av.textContent = initials;
    document.querySelectorAll('#sb-header .username-label, #sb-header .user-name').forEach(el=> el.textContent = me.username || '');

    // role gating
    const isAdmin = me.role === 'admin' || me.role === 'super_admin';
    const isMod   = me.role === 'moderator';
    const isSuper = me.role === 'super_admin';
    const isBiz   = String(me.is_verified_business||'0') === '1';

    const show = (id, yes) => { const el = byId(id); if (el) el.classList.toggle('hidden', !yes); };
    show('dd-admin', isAdmin);
    show('dd-moderator', isMod);
    show('dd-superadmin', isSuper);
    show('dd-business', isBiz);
    show('dd-users', isAdmin || isSuper);
    show('dd-smartalerts', true);
  }

  function buildMiniHeaderIfAuthPage() {
    if (!isAuthPage()) return;
    const um  = byId('user-menu');
    const nav = byId('nav-menu');
    if (um) um.classList.add('hidden');
    if (nav) nav.innerHTML = `<a href="${BASE}index.html" class="sb-link">Home</a>`;
  }

  // SB mockup start
  function setupSBSearch(){
    const $ = s => document.querySelector(s);
    const on = (el,ev,fn)=> el && el.addEventListener(ev,fn);

    let loc;
    try{ loc = JSON.parse(localStorage.getItem('sb.location')||'{}'); }catch(e){ loc = {}; }
    loc = Object.assign({mode:'country', city:null, lat:null, lng:null, radius_km:25}, loc);

    const q = $('#sb-q');
    const locPill = $('#sb-locpill');
    const locLabel = $('#sb-loclabel');
    const modal = $('#sb-locmodal');
    const cityInput = $('#sb-cityinput');
    const catBar = $('#catBar');

    const saveLoc = () => localStorage.setItem('sb.location', JSON.stringify(loc));
    const renderLoc = () => {
      let txt = 'India';
      if (loc.mode === 'city' && loc.city) txt = loc.city;
      else if (loc.mode === 'geo') txt = 'Near Me';
      if (locLabel) locLabel.textContent = txt;
    };
    renderLoc();

    function closeModal(){ if(modal) modal.setAttribute('aria-hidden','true'); }
    function openModal(){ if(modal) modal.setAttribute('aria-hidden','false'); }
    on(locPill,'click',openModal);
    on($('#sb-locclose'),'click',closeModal);
    on($('#sb-loccancel'),'click',closeModal);
    on(modal,'click',e=>{ if(e.target===modal) closeModal(); });

    on($('#sb-locapply'),'click',()=>{
      const city = (cityInput && cityInput.value.trim());
      if(city){
        loc = {mode:'city', city, lat:null, lng:null, radius_km:25};
        saveLoc(); renderLoc(); closeModal(); triggerSearch();
      }
    });

    on($('#sb-usegeo'),'click',()=>{
      if(!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(pos=>{
        loc = {mode:'geo', city:null, lat:pos.coords.latitude, lng:pos.coords.longitude, radius_km:25};
        saveLoc(); renderLoc(); closeModal(); triggerSearch();
      });
    });

    function triggerSearch(){
      const params = new URLSearchParams();
      const qv = (q && q.value.trim()) || '';
      if(qv) params.set('q', qv);
      const cat = window.currentCategory || '';
      if(cat) params.set('category', cat);
      if(loc.mode==='city' && loc.city){
        params.set('city', loc.city);
      }else if(loc.mode==='geo' && loc.lat && loc.lng){
        params.set('lat', loc.lat);
        params.set('lng', loc.lng);
        params.set('radius_km', loc.radius_km);
      }
      if(typeof window.updateDealsUI === 'function'){
        fetch(BASE + 'api/get_deals.php?' + params.toString())
          .then(r=>r.json()).then(j=>window.updateDealsUI(j)).catch(()=>{});
      }else{
        const url = new URL(location.href);
        params.forEach((v,k)=> url.searchParams.set(k,v));
        history.replaceState(null,'',url);
        try{ window.dispatchEvent(new CustomEvent('sb:search',{detail:params})); }catch(_){ }
      }
    }

    on(q,'keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); triggerSearch(); }});

    on(catBar,'click',e=>{
      const chip = e.target.closest('.chip');
      if(!chip) return;
      catBar.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      window.currentCategory = chip.dataset.cat || '';
      triggerSearch();
    });
  }
  // SB mockup end

  // --- Main init -------------------------------------------------------------
  async function init() {
    if (document.body.getAttribute(HEADER_MOUNTED_ATTR) === "1") return;

    // 1) Fetch and mount header (absolute to avoid /admin/ path issues)
    const html = await fetch(BASE + "header.html", { cache: "no-store" }).then(r => r.text());
    mountHeader(html);
    __installGlobalUserMenuDelegate();
    __wireUserDropdownUniversal();
    setupSBSearch();

    // 2) Load feature flags & translations (best-effort)
    try {
      featureFlags = await fetch(BASE + "api/feature_flags.php").then(r => r.json());
    } catch {}
    const userLang = localStorage.getItem("language") || "en";
    try {
      const trRes = await fetch(`${BASE}lang/${userLang}.json`, { cache: "no-store" });
      if (trRes.ok && (trRes.headers.get('content-type')||'').includes('application/json')) {
        TR = await trRes.json();
      } else {
        const enRes = await fetch(BASE + 'lang/en.json', { cache: "no-store" });
        if (enRes.ok) TR = await enRes.json();
      }
    } catch {
      try {
        const enRes = await fetch(BASE + 'lang/en.json', { cache: "no-store" });
        if (enRes.ok) TR = await enRes.json();
      } catch {}
    }

    // 3) Kick auth refresh which builds nav/UI
    __refreshHeaderAuth();
  }

  // --- Auth refresh (server truth) ------------------------------------------
  async function __refreshHeaderAuth(){
    try{
      const res = await fetch(BASE + 'api/auth/profile.php', { credentials: 'same-origin', cache: 'no-store' });
      if (!res.ok) throw new Error('not logged in');
      const me = await res.json();

      buildAuthedNav(me);
      normalizeHeaderDom();
      sanitizeGlobalHeader();
      cleanupStrays();
      buildMiniHeaderIfAuthPage();
      __wireUserDropdown();

      // Dropdown wiring (inside header)
      (function wireDropdown(){
        const header = byId('sb-header');
        const btn = byId('user-menu-toggle');
        const dd  = byId('user-dropdown');
        if (!header || !btn || !dd) return;

        header.addEventListener('click', (e)=>{
          const withinBtn = btn.contains(e.target);
          const withinDd  = dd.contains(e.target);
          if (withinBtn) {
            e.preventDefault();
            e.stopPropagation();
            if(dd.style.display==='none' || dd.classList.contains('hidden')){ dd.classList.remove('hidden'); dd.style.display='block'; } else { dd.style.display='none'; }
          } else if (!withinDd) {
            dd.style.display='none';
          }
        });
        document.addEventListener('click', (e)=>{
          if (!header.contains(e.target)) dd.style.display='none';
        });
      })();

      // Logout
      const logout = byId('dd-logout');
      if (logout) logout.addEventListener('click', async (e)=>{
        e.preventDefault();
        try { await fetch(BASE + 'api/auth/logout.php', {method:'POST', credentials:'same-origin'}); } catch {}
        localStorage.clear();
        sessionStorage.clear();
        location.replace(BASE + 'login.php');
      });

    }catch(_){
      buildGuestNav();
      normalizeHeaderDom();
      cleanupStrays();
      buildMiniHeaderIfAuthPage();
      __wireUserDropdown();
    }
  }

  
  function __wireUserDropdown(){
    try{
      const btn = byId('user-menu-toggle');
      const dd = byId('user-dropdown');
      if(!btn || !dd) return;
      btn.addEventListener('click', (e)=>{
        e.preventDefault();
        const open = dd.classList.toggle('hidden') === false;
        btn.setAttribute('aria-expanded', String(open));
      });
      // keyboard support
      btn.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          if(dd.style.display==='none' || dd.classList.contains('hidden')){ dd.classList.remove('hidden'); dd.style.display='block'; } else { dd.style.display='none'; }
        }
        if(e.key === 'Escape'){
          dd.style.display='none';
        }
      });

      document.addEventListener('click', (e)=>{
        const um = byId('user-menu');
        if(!um) return;
        if(!um.contains(e.target)) dd.style.display='none';
      });
    }catch{}
  }


  // --- Global delegated user menu handler (survives re-mounts) --------------
  function __installGlobalUserMenuDelegate(){
    if (window.__SB_USER_MENU_DELEGATE__) return;
    window.__SB_USER_MENU_DELEGATE__ = true;

    document.addEventListener('click', function(e){
      const um = document.getElementById('user-menu');
      const btn = document.getElementById('user-menu-toggle');
      const dd  = document.getElementById('user-dropdown');
      if(!um || !btn || !dd) return;

      const target = e.target;
      const withinBtn = btn.contains(target);
      const withinDd  = dd.contains(target);
      const withinUm  = um.contains(target);

      if (withinBtn){
        e.preventDefault();
        e.stopPropagation();
        dd.classList.toggle('hidden');
        btn.setAttribute('aria-expanded', dd.classList.contains('hidden') ? 'false':'true');
        return;
      }

      // Clicked outside entire user menu -> close
      if (!withinUm){
        dd.classList.add('hidden');
      }
    }, true);

    // Close on ESC no matter what
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape'){
        const dd = document.getElementById('user-dropdown');
        if (dd) dd.classList.add('hidden');
      }
    });
  }
// --- Boot ------------------------------------------------------------------
  __installGlobalUserMenuDelegate();
  document.addEventListener('DOMContentLoaded', init);

  // --- Fix header links to absolute /bagit/ ---
  (function normalizeHeaderLinks(){
    const BASE = '/bagit/';
    const hdr = document.getElementById('sb-header');
    if (!hdr) return;

    // logo/home
    const logo = hdr.querySelector('.logo a, a.logo, #brand a, .brand a');
    if (logo) logo.href = BASE + 'index.html';

    // super admin link if present
    const sa = hdr.querySelector('a[data-nav="superadmin"]');
    if (sa) sa.href = BASE + 'admin/superadmin.php';

    // make any other relative header links absolute
    hdr.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('/')) return;
      a.href = BASE + href.replace(/^\/?/, '');
    });
  })();

  window.addEventListener('pageshow', (e) => { if (e.persisted) __refreshHeaderAuth(); });
})();


// Inject theme assets across all pages (absolute paths)
(function ensureThemeAssets(){
  if (!document.querySelector('link[href$="theme.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/bagit/theme.css';
    document.head.appendChild(link);
  }
  if (!document.querySelector('script[src$="theme.js"]')) {
    const s = document.createElement('script');
    s.src = '/bagit/theme.js';
    s.defer = true;
    document.head.appendChild(s);
  }
})();


// ===== ROLE-AWARE HEADER START =====
(function(){
  try{
    // Ensure header mount exists
    var mount = document.getElementById('global-header');
    if(!mount){
      mount = document.createElement('div');
      mount.id = 'global-header';
      document.body.insertBefore(mount, document.body.firstChild);
    }

    // Roles from localStorage (string '1' means true)
    var isAdmin = localStorage.getItem('is_admin') === '1';
    var isModerator = localStorage.getItem('is_moderator') === '1';
    var isSuperAdmin = localStorage.getItem('is_superadmin') === '1';
    var isBiz = localStorage.getItem('is_biz') === '1';

    // Build nav items based on roles
    function navItem(href, text){
      return '<a class="gh-link" href="'+href+'">'+text+'</a>';
    }

    var nav = [
      navItem('/bagit/index.html','Home'),
      navItem('/bagit/deals.html','Deals'),
      navItem('/bagit/post_deal.html','Post Deal')
    ];

    if (isBiz)       nav.push(navItem('/bagit/business.html','Business'));
    if (isModerator) nav.push(navItem('/bagit/moderation.html','Moderator'));
    if (isAdmin)     nav.push(navItem('/bagit/admin/index.html','Admin'));
    if (isSuperAdmin)nav.push(navItem('/bagit/admin/superadmin.html','Superadmin'));

    // Username if present
    var username = localStorage.getItem('username') || '';
    var userBlock = username ? ('<span class="gh-user">Hi, '+username+'</span>') : '';

    var html = ''
      + '<header class="global-header-wrap">'
      + '  <div class="gh-inner">'
      + '    <a class="gh-logo" href="/bagit/index.html">Bagit</a>'
      + '    <nav class="gh-nav">'+ nav.join('') +'</nav>'
      + '    <div class="gh-right">'
      +        userBlock
      + '    </div>'
      + '  </div>'
      + '</header>';

    mount.innerHTML = html;

    // Minimal CSS if header.css missing or lacking classes
    var styleId = 'gh-inline-style';
    if (!document.getElementById(styleId)){
      var s = document.createElement('style');
      s.id = styleId;
      s.textContent = [
        '.global-header-wrap{position:sticky;top:0;z-index:50;background:#fff;border-bottom:1px solid #eee}',
        '.gh-inner{max-width:1200px;margin:0 auto;padding:10px 12px;display:flex;align-items:center;gap:16px}',
        '.gh-logo{font-weight:800;text-decoration:none;color:#111}',
        '.gh-nav{display:flex;gap:12px;flex:1;flex-wrap:wrap}',
        '.gh-link{color:#374151;text-decoration:none;padding:6px 10px;border-radius:8px}',
        '.gh-link:hover{background:#f5f5f5}',
        '.gh-right{display:flex;align-items:center;gap:10px;color:#6b7280}',
        '@media(max-width:768px){.gh-inner{padding:8px}.gh-nav{gap:8px}}'
      ].join('');
      document.head.appendChild(s);
    }
  }catch(e){ console.warn('Header inject error', e); }
})();
// ===== ROLE-AWARE HEADER END =====


  // --- Universal dropdown wiring (guest or authed) --------------------------
  function __wireUserDropdownUniversal(){
    try{
      const btn = document.getElementById('user-menu-toggle');
      const dd  = document.getElementById('user-dropdown');
      const um  = document.getElementById('user-menu');
      if(!btn || !dd || !um) return;

      // Avoid double-binding
      if(btn.getAttribute('data-dd-wired') === '1') return;
      btn.setAttribute('data-dd-wired','1');

      btn.addEventListener('click', (e)=>{
        e.preventDefault();
        e.stopPropagation();
        if(dd.style.display==='none' || dd.classList.contains('hidden')){ dd.classList.remove('hidden'); dd.style.display='block'; } else { dd.style.display='none'; }
        btn.setAttribute('aria-expanded', dd.classList.contains('hidden') ? 'false' : 'true');
      });

      // Close when clicking outside
      document.addEventListener('mousedown', (e)=>{
        if(!um.contains(e.target)) dd.style.display='none';
      });

      // Close on Escape
      btn.addEventListener('keydown', (e)=>{
        if(e.key === 'Escape') dd.style.display='none';
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); if(dd.style.display==='none' || dd.classList.contains('hidden')){ dd.classList.remove('hidden'); dd.style.display='block'; } else { dd.style.display='none'; } }
      });
    }catch{}
  }

