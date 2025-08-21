// bagit/search.js — server-side search that survives header re-renders
(function () {
  'use strict';

  var deb = null, input = null, boundId = null, mo = null;

  function ensureSB() {
    if (!window.SB) window.SB = { page: 1, limit: 20, category: '', sort: 'views', q: '' };
    if (!window.SB.limit || window.SB.limit < 1) window.SB.limit = 20;
    return window.SB;
  }

  function triggerFetch(){ if (typeof window.safeBoot==='function') window.safeBoot(); else if (typeof window.boot==='function') window.safeBoot ? window.safeBoot() : window.boot(); }

  function onInput() {
    var sb = ensureSB();
    var q = (input.value || '').trim();
    // cover all historical param names so your API sees it no matter what
    sb.q = q;
    sb.keyword = q;
    sb.search = q;
    sb.page = 1;
    clearTimeout(deb);
    deb = setTimeout(triggerFetch, 200); // debounce to avoid spamming
  }

  function bind() {
    var el = document.getElementById('deal-search');
    if (!el) return false;

    // If the input element was replaced, rebind
    if (boundId && el !== input) {
      try { input.removeEventListener('input', onInput); } catch(e){}
    }
    input = el;
    boundId = true;

    if (!input.__wiredSearch) {
      input.__wiredSearch = true;
      // keep box in sync with current SB.q on load
      try {
        var sb = window.SB || {};
        if (typeof sb.q === 'string') input.value = sb.q;
      } catch (e) {}

      input.addEventListener('input', onInput);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { clearTimeout(deb); onInput(); }
      });
    }
    return true;
  }

  function init() {
    // Try now…
    if (!bind()) {
      // …header might mount late; retry a few times
      var tries = 0;
      var t = setInterval(function () {
        if (bind() || ++tries > 25) clearInterval(t);
      }, 80);
    }

    // Watch for DOM changes (category/sort re-render or header swap)
    if (!mo && 'MutationObserver' in window) {
      mo = new MutationObserver(function () {
        // if input got replaced, rebind; also re-run query to keep results in sync
        var had = input;
        var ok = bind();
        if (ok && had && input && input.value !== undefined) {
          // re-apply current query without user typing again
          onInput();
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
