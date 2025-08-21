// deals_filters_v3.js — responsive: category chips on desktop, dropdown on mobile; grid removed
(function(){
  'use strict';

  function SBget(){
    if (!window.SB) window.SB = { page:1, limit:24, category:'', sort:'heat', q:'' };
    if (typeof window.SB.limit !== 'number' || window.SB.limit <= 0) window.SB.limit = 24;
    if (!('category' in window.SB)) window.SB.category = '';
    if (!('sort' in window.SB)) window.SB.sort = 'heat';
    return window.SB;
  }

  function forceRefetch(){
    var SB = SBget();
    SB.page = 1; SB.__append = false; SB.hasMore = true;
    window.__sbLastQS = null; window.__sbFetchBusy = false;
    try{ if (typeof window.boot==='function') window.boot(); else if (typeof window.safeBoot==='function') window.safeBoot(); }catch(e){}
  }

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
    {key:'new',   label:'Newest'},
    {key:'heat',  label:'Top'},
    {key:'price', label:'Price (Low → High)'}
  ];

  function isMobile(){ return window.matchMedia && window.matchMedia('(max-width: 640px)').matches; }

  function render(){
    var bar = document.getElementById('deals-toolbar');
    if (!bar) return;
    var SB = SBget();

    var sortsOpts = SORTS.map(function(s){
      var sel = (String(SB.sort||'heat') === s.key) ? ' selected' : '';
      return '<option value="'+s.key+'"'+sel+'>'+s.label+'</option>';
    }).join('');

    var catsMarkup;
    if (isMobile()){
      // compact dropdown for category on small screens
      var catOptions = CATS.map(function(c){
        var sel = (String(SB.category||'') === c.key) ? ' selected' : '';
        return '<option value="'+c.key+'"'+sel+'>'+c.label+'</option>';
      }).join('');
      catsMarkup =
        '<div class="filter-row">' +
          '<label class="lbl">Category</label>' +
          '<select id="sb-cat" class="select full">'+catOptions+'</select>' +
        '</div>';
    } else {
      // desktop: pill tabs
      var tabs = CATS.map(function(c){
        var active = (String(SB.category||'') === c.key) ? ' is-active' : '';
        return '<button type="button" class="tab'+active+'" data-cat="'+c.key+'">'+c.label+'</button>';
      }).join('');
      catsMarkup = '<div class="tabs">'+tabs+'</div>';
    }

    bar.innerHTML =
      catsMarkup +
      '<div class="sort"><label>Sort ' +
      '<select id="sb-sort">'+sortsOpts+'</select></label>' +
      '</div>';

    // minimal styles for mobile select
    if (!document.getElementById('sb-filters-inline-style')){
      var st = document.createElement('style');
      st.id = 'sb-filters-inline-style';
      st.textContent = '' +
      '.filter-row{display:flex;gap:.5rem;align-items:center;margin:.25rem 0 .5rem}' +
      '.filter-row .lbl{font-size:.875rem;color:#374151}' +
      '.select.full{width:100%;max-width:16rem;padding:.35rem .5rem;border:1px solid #d1d5db;border-radius:.5rem;background:#fff}' +
      '.tabs{display:flex;flex-wrap:wrap;gap:.5rem;margin:.25rem 0 .5rem}' +
      '.tab{padding:.35rem .6rem;border:1px solid #e5e7eb;border-radius:999px;background:#fff;font-size:.875rem}' +
      '.tab.is-active{background:#111827;color:#fff;border-color:#111827}' +
      '.sort{margin:.25rem 0 .5rem}';
      document.head.appendChild(st);
    }
  }

  function bind(){
    var bar = document.getElementById('deals-toolbar');
    if (!bar) return;
    // clear previous wiring flag so we can re-bind after re-render on resize
    if (bar.__wired) bar.__wired = false;
    if (bar.__wired) return;
    bar.__wired = true;

    // tabs (desktop)
    bar.addEventListener('click', function(ev){
      var t = ev.target; if (!t || !t.matches('.tab')) return;
      var SB = SBget();
      var cat = t.getAttribute('data-cat') || '';
      if (String(SB.category||'') === String(cat)) return;
      SB.category = cat; SB.page = 1;
      bar.querySelectorAll('.tab').forEach(function(x){ x.classList.toggle('is-active', x === t); });
      forceRefetch();
    });

    // category select (mobile)
    var catSel = bar.querySelector('#sb-cat');
    if (catSel){
      catSel.addEventListener('change', function(){
        var SB = SBget();
        var v = catSel.value || '';
        if (String(SB.category||'') === String(v)) return;
        SB.category = v; SB.page = 1;
        forceRefetch();
      });
    }

    // sort select
    var sel = bar.querySelector('#sb-sort');
    if (sel){
      sel.addEventListener('change', function(){
        var SB = SBget();
        var v = sel.value || 'heat';
        if (SB.sort === v) return;
        SB.sort = v; SB.page = 1;
        forceRefetch();
      });
    }
  }

  function init(){ render(); bind(); }

  // re-render on viewport change (mobile <-> desktop)
  var mq = (window.matchMedia && window.matchMedia('(max-width: 640px)')) || null;
  if (mq){
    // addEventListener is supported in modern browsers; fallback to addListener
    (mq.addEventListener || mq.addListener).call(mq,'change',function(){ init(); });
  }
  window.addEventListener('resize', function(){ init(); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
