
/**
 * pagination.js — Reusable client-side pagination nav
 * Usage:
 *   <nav id="pagination" class="pagination" data-total-pages="12"></nav>
 *   Include this script; it will render controls based on ?page= in URL.
 *   Server should respect ?page and ?limit to return the correct list.
 */
(function(){
  function qs(k){ return new URLSearchParams(location.search).get(k); }
  function setParam(url, key, value){
    const u = new URL(url, location.origin);
    const sp = u.searchParams;
    if (value == null || value === '') sp.delete(key); else sp.set(key, value);
    return u.pathname + '?' + sp.toString();
  }
  function build(el){
    if (!el) return;
    var total = parseInt(el.getAttribute('data-total-pages')||'0',10);
    if (!total || total < 2){ el.innerHTML=''; el.style.display='none'; return; }
    var current = parseInt(qs('page')||'1',10); if (current<1) current=1; if (current>total) current=total;
    var limit = qs('limit') || '';
    var win = 2; // window size around current
    var frag = document.createDocumentFragment();

    function link(label, page, disabled){
      var a = document.createElement('a');
      a.textContent = label;
      if (disabled){ a.setAttribute('aria-disabled','true'); a.className='pg-disabled'; }
      else{
        var href = setParam(location.href, 'page', page);
        if (limit) href = setParam(href, 'limit', limit);
        a.href = href;
      }
      a.classList.add('pg-link');
      return a;
    }

    // First/Prev
    frag.appendChild(link('« First', 1, current===1));
    frag.appendChild(link('‹ Prev', current-1, current===1));

    // Page window
    var start = Math.max(1, current - win);
    var end   = Math.min(total, current + win);
    if (start > 1){
      frag.appendChild(link('1', 1, false));
      if (start > 2){
        var span = document.createElement('span'); span.textContent='…'; span.className='pg-ellipsis';
        frag.appendChild(span);
      }
    }
    for (var p=start; p<=end; p++){
      if (p === current){
        var span = document.createElement('span'); span.textContent=String(p); span.className='pg-current';
        frag.appendChild(span);
      }else{
        frag.appendChild(link(String(p), p, false));
      }
    }
    if (end < total){
      if (end < total-1){
        var span2 = document.createElement('span'); span2.textContent='…'; span2.className='pg-ellipsis';
        frag.appendChild(span2);
      }
      frag.appendChild(link(String(total), total, false));
    }

    // Next/Last
    frag.appendChild(link('Next ›', current+1, current===total));
    frag.appendChild(link('Last »', total, current===total));

    el.innerHTML='';
    el.appendChild(frag);
    el.style.display='flex';
  }

  document.addEventListener('DOMContentLoaded', function(){
    var el = document.getElementById('pagination');
    if (!el){
      // Try common alternative ids
      el = document.querySelector('.pagination, nav[role="navigation"].pagination');
    }
    if (el) build(el);
  });
})();
