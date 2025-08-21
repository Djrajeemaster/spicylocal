// SB mockup start
(() => {
  const BASE = '/bagit/';
  const HEADER_MOUNTED_ATTR = 'data-header-mounted';
  const $ = (s) => document.querySelector(s);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  let loc = JSON.parse(localStorage.getItem('sb.location') || 'null') || {
    mode: 'country',
    city: null,
    lat: null,
    lng: null,
    radius_km: 25
  };

  function saveLoc() {
    localStorage.setItem('sb.location', JSON.stringify(loc));
  }

  function locLabel() {
    if (loc.mode === 'city' && loc.city) return loc.city;
    if (loc.mode === 'geo') return 'Near Me';
    return 'India';
  }

  function renderLoc() {
    const lbl = $('#sb-loclabel');
    if (lbl) lbl.textContent = locLabel();
  }

  function buildParams() {
    const params = new URLSearchParams();
    const q = ($('#sb-q')?.value || '').trim();
    if (q) params.set('q', q);
    const cat = window.currentCategory || '';
    if (cat) params.set('category', cat);
    if (loc.mode === 'city' && loc.city) params.set('city', loc.city);
    if (loc.mode === 'geo' && loc.lat && loc.lng) {
      params.set('lat', loc.lat);
      params.set('lng', loc.lng);
      params.set('radius_km', loc.radius_km || 25);
    }
    return params;
  }

  function triggerSearch() {
    const params = buildParams();
    if (typeof window.updateDealsUI === 'function') {
      fetch(BASE + 'api/get_deals.php?' + params.toString())
        .then(r => r.json())
        .then(d => {
          try { window.updateDealsUI(d); } catch (_) {}
        });
    } else {
      const url = location.pathname + (params.toString() ? '?' + params.toString() : '');
      history.replaceState(null, '', url);
      try { window.dispatchEvent(new CustomEvent('sb:search', { detail: params })); } catch (_) {}
    }
  }

  function wireSearch() {
    on($('#sb-q'), 'keydown', e => {
      if (e.key === 'Enter') triggerSearch();
    });
  }

  function wireLocation() {
    const modal = $('#sb-locmodal');
    const show = () => modal && modal.setAttribute('aria-hidden', 'false');
    const hide = () => modal && modal.setAttribute('aria-hidden', 'true');
    on($('#sb-locpill'), 'click', show);
    on($('#sb-locclose'), 'click', hide);
    on($('#sb-loccancel'), 'click', hide);
    on(modal, 'click', e => { if (e.target === modal) hide(); });
    on($('#sb-locapply'), 'click', () => {
      const city = ($('#sb-cityinput')?.value || '').trim();
      if (city) {
        loc = { mode: 'city', city, lat: null, lng: null, radius_km: 25 };
        saveLoc();
        renderLoc();
        triggerSearch();
      }
      hide();
    });
    on($('#sb-usegeo'), 'click', () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(pos => {
        loc = {
          mode: 'geo',
          city: null,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          radius_km: 25
        };
        saveLoc();
        renderLoc();
        triggerSearch();
        hide();
      });
    });
  }

  function wireCategories() {
    const bar = $('#catBar');
    if (!bar) return;
    bar.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      bar.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      window.currentCategory = chip.dataset.cat || '';
      triggerSearch();
    });
  }

  async function mountHeader() {
    if (document.body.getAttribute(HEADER_MOUNTED_ATTR) === '1') return;
    const html = await fetch(BASE + 'header.html', { cache: 'no-store' }).then(r => r.text());
    const mount = document.getElementById('global-header');
    if (mount) mount.innerHTML = html; else document.body.insertAdjacentHTML('afterbegin', html);
    document.body.setAttribute(HEADER_MOUNTED_ATTR, '1');
    renderLoc();
    wireSearch();
    wireLocation();
    wireCategories();
  }

  document.addEventListener('DOMContentLoaded', mountHeader);
})();
// SB mockup end
