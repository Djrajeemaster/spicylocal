(function(){
  'use strict';
  function log(){ try{ console.log.apply(console, arguments); }catch(e){} }
  function debounce(fn, wait){ var t=null; return function(){ var self=this, args=arguments; clearTimeout(t); t=setTimeout(function(){ fn.apply(self,args); }, wait||80); }; }
  var safeBoot = debounce(function(){ try{ if (typeof window.boot === 'function') window.boot(); }catch(e){ log('[sb] boot error', e); } }, 80);
  function ensureSB(){ if (!window.SB) window.SB = { page:1, limit:10, category:'', sort:'views', q:'' }; if (!window.__sbLimitSet) { window.SB.limit = 20; window.__sbLimitSet = true; } return window.SB; }
  function applyGridState(bar){ var list=document.getElementById('deal-list'); var saved=null; try{ saved=localStorage.getItem('sb_grid'); }catch(e){} var wanted=(saved==='1'); if(list&&list.classList){ if(wanted) list.classList.add('grid-mode'); else list.classList.remove('grid-mode'); } var cb=bar?bar.querySelector('#sb-grid'):null; if(cb) cb.checked=wanted; }
  function renderToolbar(){
    var bar=document.getElementById('deals-toolbar');
    if(!bar){ var sb=document.getElementById('search-bar'); bar=document.createElement('div'); bar.id='deals-toolbar'; bar.className='deals-toolbar'; if(sb&&sb.parentNode) sb.parentNode.insertBefore(bar, sb.nextElementSibling); else document.body.insertBefore(bar, document.body.firstChild); }
    var SB=ensureSB();
    var CATS=[{key:'',label:'All Deals'},{key:'Electronics',label:'Electronics'},{key:'Entertainment',label:'Entertainment'},{key:'Food',label:'Food'},{key:'Fashion',label:'Fashion'},{key:'Beauty',label:'Beauty'},{key:'Groceries',label:'Groceries'},{key:'Travel',label:'Travel'}];
    var tabs='',i; for(i=0;i<CATS.length;i++){ var c=CATS[i]; var act=(String(SB.category||'')===c.key)?' active':''; tabs+='<button class="tab'+act+'" data-cat="'+c.key+'">'+c.label+'</button>'; }
    var sorts=[{key:'views',label:'Newest'},{key:'heat',label:'Trending'}], j, opts=''; for(j=0;j<sorts.length;j++){ var s=sorts[j]; var sel=(String(SB.sort||'views')===s.key)?' selected':''; opts+='<option value="'+s.key+'"'+sel+'>'+s.label+'</option>'; }
    var gridChecked=''; try{ gridChecked=(localStorage.getItem('sb_grid')==='1')?' checked':''; }catch(e){}
    bar.innerHTML='<div class="tabs">'+tabs+'</div><div class="spacer"></div><label class="sort">Sort <select id="sb-sort">'+opts+'</select></label><label class="grid-tog"><input type="checkbox" id="sb-grid"'+gridChecked+'> Grid</label>';
    if(bar.__wired){ applyGridState(bar); return; }
    bar.__wired=true;
    bar.addEventListener('click', function(evt){ var t=evt.target; while(t&&t!==bar&&(!t.classList||!t.classList.contains('tab'))){ t=t.parentNode; } if(!t||t===bar) return; var SB=ensureSB(); SB.category=t.getAttribute('data-cat')||''; SB.page=1; renderToolbar(); safeBoot(); });
    var sel=bar.querySelector('#sb-sort'); if(sel){ sel.addEventListener('change', function(){ var SB=ensureSB(); SB.sort=sel.value||'views'; SB.page=1; safeBoot(); }); }
    var grid=bar.querySelector('#sb-grid'); if(grid){ grid.addEventListener('change', function(){ var list=document.getElementById('deal-list'); if(list&&list.classList){ if(grid.checked) list.classList.add('grid-mode'); else list.classList.remove('grid-mode'); } try{ localStorage.setItem('sb_grid', grid.checked?'1':'0'); }catch(e){} }); }
    applyGridState(bar);
  }
  function init(){ renderToolbar(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();