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

  function mountHeader(html) {
    const mountPoint = document.getElementById("global-header");
    if (mountPoint) {
      mountPoint.innerHTML = html;
    } else {
      document.body.insertAdjacentHTML("afterbegin", html);
    }
    document.body.setAttribute(HEADER_MOUNTED_ATTR, "1");
    sanitizeGlobalHeader();
  }

  // --- Helpers ---------------------------------------------------------------
  function isAuthPage() {
    const p = location.pathname.toLowerCase();
    return p.endsWith('/login.html')
        || p.endsWith('/signup.html')
        || p.endsWith('/register.php')
        || p.endsWith('/login_unified.php');
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
        || href.endsWith('login_unified.php');
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
      `<a href="${BASE}index.html" class="nav-link nav-home">${t('home')==='home'?'Home':t('home')}</a>`,
      isAuthPage() ? '' : `<a href="${BASE}login_unified.php" class="nav-link login-link">Login</a>`,
      isAuthPage() ? '' : `<a href="${BASE}signup.html" class="nav-link signup-link">Signup</a>`
    ].filter(Boolean).join('');
    const um = byId('user-menu');
    if (um) um.classList.add('hidden');
  }

  function buildAuthedNav(me) {
    const nav = byId('nav-menu');
    if (!nav) return;

    const links = [];
    links.push(`<a href="${BASE}index.html" class="nav-link nav-home">${t('home')==='home'?'Home':t('home')}</a>`);
    // Post Deal (skip if muted)
    const isMuted = localStorage.getItem('is_muted') === '1';
    if (!isMuted) links.push(`<a href="${BASE}submit_deal.html">${t('post_deal')==='post_deal'?'Post Deal':t('post_deal')}</a>`);
    // Leaderboard (feature flag)
    if (featureFlags.leaderboard) links.push(`<a href="${BASE}leaderboard.html">${t('leaderboard')==='leaderboard'?'Leaderboard':t('leaderboard')}</a>`);
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
            dd.classList.toggle('hidden');
          } else if (!withinDd) {
            dd.classList.add('hidden');
          }
        });
        document.addEventListener('click', (e)=>{
          if (!header.contains(e.target)) dd.classList.add('hidden');
        });
      })();

      // Logout
      const logout = byId('dd-logout');
      if (logout) logout.addEventListener('click', async (e)=>{
        e.preventDefault();
        try { await fetch(BASE + 'api/auth/logout.php', {method:'POST', credentials:'same-origin'}); } catch {}
        localStorage.clear();
        sessionStorage.clear();
        location.replace(BASE + 'login_unified.php');
      });

    }catch(_){
      buildGuestNav();
      normalizeHeaderDom();
      cleanupStrays();
      buildMiniHeaderIfAuthPage();
    }
  }

  // --- Boot ------------------------------------------------------------------
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
