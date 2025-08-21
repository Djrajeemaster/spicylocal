(function(){
  'use strict';
  try{ console.log('[sb] deals_filters v2'); }catch(e){}

  function canReload(){
    try{ return (typeof window!=='undefined' && window.SB && typeof window.boot==='function'); }catch(e){ return false; }
  }

  function ensureToolbar(){
    var bar = document.getElementById('deals-toolbar');
    if(!bar){
      var sb = document.getElementById('search-bar');
      bar = document.createElement('div');
      bar.id = 'deals-toolbar';
      bar.className = 'deals-toolbar';
      if (sb && sb.parentNode) { sb.parentNode.insertBefore(bar, sb.nextSibling); }
      else if (document.body && document.body.firstChild) { document.body.insertBefore(bar, document.body.firstChild); }
      else { document.body.appendChild(bar); }
    }
    return bar;
  }

  function checkedAttr(){
    var list = document.getElementById('deal-list');
    if (list && list.classList && list.classList.contains('grid-mode')) return 'checked';
    return '';
  }

  function renderToolbar(){
    var bar = ensureToolbar();
    var SB = window.SB || {page:1,limit:10,category:'',sort:'views',q:''};

    var CATS = [
      {key:'', label:'All Deals'},
      {key:'Electronics', label:'Electronics'},
      {key:'Entertainment', label:'Entertainment'},
      {key:'Food', label:'Food'},
      {key:'Fashion', label:'Fashion'},
      {key:'Beauty', label:'Beauty'},
      {key:'Groceries', label:'Groceries'},
      {key:'Travel', label:'Travel'}
    ];
    var SORTS = [
      {key:'views', label:'Newest'},
      {key:'heat',  label:'Trending'}
    ];

    var catBtns = [];
    for (var i=0;i<CATS.length;i++){
      var c = CATS[i];
      var active = (String(SB.category||'') === c.key);
      catBtns.push('<button class="tab'+(active?' active':'')+'" data-cat="'+c.key+'">'+c.label+'</button>');
    }
    var sortOpts = [];
    for (var j=0;j<SORTS.length;j++){
      var s = SORTS[j];
      var sel = (String(SB.sort||'views')===s.key) ? ' selected' : '';
      sortOpts.push('<option value="'+s.key+'"'+sel+'>'+s.label+'</option>');
    }

    var html = ''
      + '<div class=\"tabs\">'+catBtns.join('')+'</div>'
      + '<div class=\"spacer\"></div>'
      + '<label class=\"sort\">Sort <select id=\"sb-sort\">'+sortOpts.join('')+'</select></label>'
      + '<label class=\"grid-tog\"><input type=\"checkbox\" id=\"sb-grid\" '+checkedAttr()+'> Grid</label>';

    bar.innerHTML = html;

    // Events
    bar.onclick = function(e){
      e = e || window.event;
      var t = e.target || e.srcElement;
      // closest polyfill-ish
      while (t && t !== bar && (!t.classList || !t.classList.contains('tab'))) { t = t.parentNode; }
      if (!t || t===bar) return;
      SB.category = t.getAttribute('data-cat') || '';
      SB.page = 1;
      window.SB = SB;
      try{ renderToolbar(); }catch(err){}
      if (canReload()) { try{ window.boot(); }catch(err){ console.error('[sb] boot error', err); } }
    };

    var sel = bar.querySelector('#sb-sort');
    if (sel){
      sel.onchange = function(ev){
        SB.sort = (ev && ev.target && ev.target.value) ? ev.target.value : 'views';
        SB.page = 1;
        window.SB = SB;
        if (canReload()) { try{ window.boot(); }catch(err){ console.error('[sb] boot error', err); } }
      };
    }

    var grid = bar.querySelector('#sb-grid');
    if (grid){
      grid.onchange = function(){
        var list = document.getElementById('deal-list');
        if (list && list.classList){
          if (grid.checked) list.classList.add('grid-mode');
          else list.classList.remove('grid-mode');
        }
      };
    }
  }

  function init(){ try{ renderToolbar(); }catch(e){ console.error('[sb] toolbar init failed', e); } }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();