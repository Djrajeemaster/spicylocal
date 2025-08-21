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
    nav.innerHTML = [
      `<a href="${BASE}submit_deal.html" class="sb-link">+ Post Deal</a>`,
      `<a href="${BASE}smart_alerts.html" class="sb-link">Alerts</a>`
    ].join('');

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

    const links = [];
    const isMuted = localStorage.getItem('is_muted') === '1';
    if (!isMuted) links.push(`<a href="${BASE}submit_deal.html" class="sb-link">+ Post Deal</a>`);
    links.push(`<a href="${BASE}smart_alerts.html" class="sb-link">Alerts</a>`);
    nav.innerHTML = links.join('');


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
    if (nav) nav.innerHTML = `<a href="${BASE}index.html" class="nav-link nav-home">Home</a>`;
  }

  // --- Main init -------------------------------------------------------------
  async function init() {
    if (document.body.getAttribute(HEADER_MOUNTED_ATTR) === "1") return;

    // 1) Fetch and mount header (absolute to avoid /admin/ path issues)
    const html = await fetch(BASE + "header.html", { cache: "no-store" }).then(r => r.text());
    mountHeader(html);
    __installGlobalUserMenuDelegate();
    __wireUserDropdownUniversal();
    wireSBHeader();

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

  // SB mockup start
  function wireSBHeader(){
    const $ = (s)=>document.querySelector(s);
    const on = (el,ev,fn)=>el&&el.addEventListener(ev,fn);
    const LS_KEY='sb.location';
    let loc={mode:'country',city:null,lat:null,lng:null,radius_km:25};
    try{ const saved=JSON.parse(localStorage.getItem(LS_KEY)||'{}'); Object.assign(loc,saved||{}); }catch{}
    const save=()=>localStorage.setItem(LS_KEY,JSON.stringify(loc));
    const updateLabel=()=>{
      const lbl=$('#sb-loclabel');
      if(!lbl) return;
      if(loc.mode==='city'&&loc.city) lbl.textContent=loc.city;
      else if(loc.mode==='geo') lbl.textContent='Near Me';
      else lbl.textContent='India';
    };
    updateLabel();
    const hideModal=()=>{ const m=$('#sb-locmodal'); if(m) m.setAttribute('aria-hidden','true'); };
    const showModal=()=>{ const m=$('#sb-locmodal'); if(m) m.setAttribute('aria-hidden','false'); };
    on($('#sb-locpill'),'click',showModal);
    on($('#sb-locclose'),'click',hideModal);
    on($('#sb-loccancel'),'click',hideModal);
    on($('#sb-locmodal'),'click',e=>{ if(e.target.id==='sb-locmodal') hideModal(); });
    on($('#sb-locapply'),'click',()=>{
      const city=($('#sb-cityinput').value||'').trim();
      if(city){ loc={mode:'city',city,lat:null,lng:null,radius_km:25}; save(); updateLabel(); }
      hideModal(); triggerSearch();
    });
    on($('#sb-usegeo'),'click',()=>{
      if(!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(pos=>{
        loc={mode:'geo',city:null,lat:pos.coords.latitude,lng:pos.coords.longitude,radius_km:25};
        save(); updateLabel(); hideModal(); triggerSearch();
      });
    });

    function buildParams(){
      const p=new URLSearchParams();
      const q=($('#sb-q').value||'').trim();
      if(q) p.set('q',q);
      const cat=window.currentCategory||'';
      if(cat) p.set('category',cat);
      if(loc.mode==='city'&&loc.city) p.set('city',loc.city);
      if(loc.mode==='geo'&&loc.lat&&loc.lng){
        p.set('lat',loc.lat); p.set('lng',loc.lng); p.set('radius_km',loc.radius_km);
      }
      return p;
    }

    function triggerSearch(){
      const params=buildParams();
      if(typeof window.updateDealsUI==='function'){
        fetch('/bagit/api/get_deals.php?'+params.toString()).then(r=>r.json()).then(j=>{ try{ window.updateDealsUI(j); }catch(_){}});
      }else{
        const url=new URL(location.href);
        url.search=params.toString();
        history.replaceState(null,'',url);
        try{ window.dispatchEvent(new CustomEvent('sb:search',{detail:params})); }catch(_){ }
      }
    }

    on($('#sb-q'),'keydown',e=>{ if(e.key==='Enter') triggerSearch(); });

    window.currentCategory=document.querySelector('#catBar .chip.active')?.dataset.cat||'';
    on($('#catBar'),'click',e=>{
      const chip=e.target.closest('.chip');
      if(!chip) return;
      document.querySelector('#catBar .chip.active')?.classList.remove('active');
      chip.classList.add('active');
      window.currentCategory=chip.dataset.cat||'';
      triggerSearch();
    });
  }
  // SB mockup end
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

