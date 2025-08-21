(function(){ if(!window.imgFallback){ window.imgFallback=function(img){ if(!img||img.dataset.fallbackApplied) return; img.dataset.fallbackApplied='1'; var t=(img.getAttribute('data-title')||img.alt||'Deal').slice(0,2).toUpperCase(); var s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e5e7eb"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="55%" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,Roboto,Arial" font-weight="700" font-size="40" fill="#111827">'+t+'</text></svg>'; img.src='data:image/svg+xml;utf8,'+encodeURIComponent(s); img.classList.add('thumb--placeholder');}; }})();

function reportOk(r){ try{ return r && (r.success===true || r.status==='ok' || r.status==='success' || r.message==='ok' || r.error===false); }catch(e){ return false; } }
'use strict';

async function isLoggedIn(){
  try{
    var u = localStorage.getItem('username') || localStorage.getItem('user') || localStorage.getItem('auth_user') || '';
    return !!u;
  }catch(e){ return false; }
}


function ensureLoginModal(){
  if (document.getElementById('sb-login-overlay')) return;

  // Overlay
  var ov = document.createElement('div');
  ov.id = 'sb-login-overlay';
  ov.setAttribute('role','presentation');
  ov.style.position = 'fixed';
  ov.style.inset = '0';
  ov.style.display = 'none';
  ov.style.alignItems = 'center';
  ov.style.justifyContent = 'center';
  ov.style.background = 'rgba(0,0,0,.45)';
  ov.style.zIndex = '9999';

  // Modal
  var modal = document.createElement('div');
  modal.setAttribute('role','dialog');
  modal.setAttribute('aria-modal','true');
  modal.setAttribute('aria-labelledby','sb-login-title');
  modal.style.background = '#fff';
  modal.style.width = 'min(92vw, 420px)';
  modal.style.borderRadius = '14px';
  modal.style.boxShadow = '0 12px 30px rgba(0,0,0,.18)';
  modal.style.padding = '20px';
  modal.style.fontFamily = 'system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif';
  modal.style.lineHeight = '1.45';

  // Title
  var h3 = document.createElement('h3');
  h3.id = 'sb-login-title';
  h3.textContent = 'Login required';
  h3.style.margin = '0 0 8px';
  h3.style.fontSize = '18px';
  h3.style.color = '#111827';

  // Message
  var p = document.createElement('p');
  p.id = 'sb-login-msg';
  p.textContent = 'You need to log in to continue.';
  p.style.margin = '0 0 16px';
  p.style.color = '#4b5563';

  // Actions
  var actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '8px';
  actions.style.justifyContent = 'flex-end';

  function styleBtn(btn, primary){
    btn.style.appearance = 'none';
    btn.style.border = '0';
    btn.style.padding = '10px 14px';
    btn.style.borderRadius = '10px';
    btn.style.fontWeight = '600';
    btn.style.cursor = 'pointer';
    if(primary){
      btn.style.background = '#2563eb';
      btn.style.color = '#fff';
    } else {
      btn.style.background = '#f3f4f6';
      btn.style.color = '#111827';
    }
  }

  var cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.id = 'sb-login-cancel';
  cancel.textContent = 'Close';
  styleBtn(cancel, false);

  var go = document.createElement('button');
  go.type = 'button';
  go.id = 'sb-login-go';
  go.textContent = 'Log in';
  styleBtn(go, true);

  actions.appendChild(cancel);
  actions.appendChild(go);

  modal.appendChild(h3);
  modal.appendChild(p);
  modal.appendChild(actions);
  ov.appendChild(modal);
  document.body.appendChild(ov);
}

function showLoginModal(action){
  ensureLoginModal();
  var ov = document.getElementById('sb-login-overlay');
  var msg = document.getElementById('sb-login-msg');
  if (msg) msg.textContent = 'You need to log in to ' + (action||'use this feature') + '.';

  // Show
  ov.style.display = 'flex';

  // Lock background scroll
  var prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  var cancel = document.getElementById('sb-login-cancel');
  var go = document.getElementById('sb-login-go');

  function cleanup(){
    ov.style.display = 'none';
    document.body.style.overflow = prevOverflow || '';
    if (cancel) cancel.removeEventListener('click', onCancel, true);
    if (go) go.removeEventListener('click', onGo, true);
    ov.removeEventListener('click', onBackdrop, true);
    document.removeEventListener('keydown', onKey, true);
  }
  // Focus
  if (go) { try { go.focus(); } catch(e){} }
}

function promptLogin(action){
  if (window.__LOGIN_PROMPT_LOCK) return;
  window.__LOGIN_PROMPT_LOCK = true;
  showLoginModal(action);
  setTimeout(function(){ window.__LOGIN_PROMPT_LOCK = false; }, 350);
}

// Global capture: stops any clicks on elements marked as requiring login
document.addEventListener('click', function(ev){
  try{
    var t = ev.target && ev.target.closest ? ev.target.closest('[data-requires-login]') : null;
    if(!t) return;
    if(!window.__IS_LOGGED_IN__){
      ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
      var act = t.getAttribute('data-login-action') || 'use this feature';
      promptLogin(act);
      if (document.activeElement) { try { document.activeElement.blur(); } catch(e){} }
    }
  }catch(e){}
}, true);
// helpers (ASCII-only)
function qs(s,ctx=document){ return ctx.querySelector(s); }
function qsa(s,ctx=document){ return Array.from(ctx.querySelectorAll(s)); }
function esc(s){
  return String(s || '').replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}
function parseMoneyNumber(v){
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  var s = String(v).replace(/[^0-9.]/g, '');
  var n = Number(s);
  return isNaN(n) ? null : n;
}
function money(v){
  var n = parseMoneyNumber(v);
  return n === null ? '' : '₹' + n.toFixed(2);
}
function fmt(ts){
  if(!ts) return '';
  var d = new Date(ts);
  if(isNaN(d)) return '';
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var h = d.getHours(), m = d.getMinutes();
  var ap = h >= 12 ? 'PM' : 'AM';
  h = ((h + 11) % 12) + 1;
  function pad(x){ return String(x).padStart(2,'0'); }
  return months[d.getMonth()] + ' ' + pad(d.getDate()) + ', ' + d.getFullYear() + ' ' + pad(h) + ':' + pad(m) + ' ' + ap;
}
function param(name){ return new URL(location.href).searchParams.get(name); }
function API(p){ return './api/' + p; }
var DEAL_ID = Number(param('id') || 0);

/* ---- NEW: author badge mapping ---- */
/* ---- author badge with role overrides (admin > mod > verified) ---- */
function setAuthorBadge(d){
  const host = document.getElementById('author-badge');
  if (!host) return;

  // reset container
  host.className = 'badge-svg';
  host.title = '';
  host.innerHTML = '';

  // Optional manual overrides by username (lowercased): set once globally
  // Example: window.ROLE_OVERRIDES = { 'moder': 'mod', 'alice_admin': 'admin' };
  const uname = String((d && d.username) || '').toLowerCase();
  const overrides = (window.ROLE_OVERRIDES || {});
  const forced = String(overrides[uname] || '').toLowerCase().trim();

  // normalize role/flags from payload
  const roleStr = String(d && (d.role ?? d.user_role ?? d.role_name) || '').toLowerCase().trim();
  const stry   = (x) => String(x).toLowerCase().trim();
  const asBool = (x) => ['1','true','yes','on'].includes(stry(x)) || x === 1 || x === true;

  let isAdmin = false, isMod = false, isVer = false;

  if (forced) {
    // Forced role by override wins completely
    isAdmin = (forced === 'admin' || forced === 'administrator');
    isMod   = !isAdmin && (forced === 'mod' || forced === 'moderator');
    isVer   = !isAdmin && !isMod && (forced === 'verified' || forced === 'verified_user' || forced === 'business');
  } else {
    // normal detection from API
    isAdmin = (roleStr === 'admin' || roleStr === 'administrator') || asBool(d && (d.is_admin || d.admin));
    isMod   = !isAdmin && ((roleStr === 'moderator' || roleStr === 'mod') || asBool(d && (d.is_moderator || d.moderator)));
    isVer   = !isAdmin && !isMod && (
                asBool(d && (d.is_verified || d.is_verified_business)) ||
                roleStr === 'verified' || roleStr === 'verified_user' || roleStr === 'business'
             );
  }

  if (!(isAdmin || isMod || isVer)) return; // no badge

  // build inline SVG and hard-set color on the path (CSS can’t override)
  const svg  = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 20 20'); svg.setAttribute('aria-hidden','true');

  const path = document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('d','M10 1.8 12 4l2.9.6.6 2.9L18 10l-2.5 2.5-.6 2.9L12 16l-2 2-2-2-2.9.6-.6-2.9L2 10l2.5-2.5.6-2.9L8 4l2-2zM8.7 10.9l-1.8-1.8-1.3 1.3 3.1 3.1 5-5-1.3-1.3-3.7 3.7z');
  path.setAttribute('fill', isAdmin ? '#ef4444' : isMod ? '#16a34a' : '#2563eb');

  svg.appendChild(path);
  host.appendChild(svg);

  host.title = isAdmin ? 'Admin'
            : isMod   ? 'Moderator'
            : ( (d && (d.is_verified_business === 1 || d.is_verified_business === '1' || d.is_verified_business === true)) ? 'Verified Business' : 'Verified User');
}
// load deal
async function loadDeal(){
  var res = await fetch(API('get_deal.php?id=' + DEAL_ID));
  var j = await res.json();
  if(!j.success){ throw new Error(j.error || 'load failed'); }
  var d = j.deal || {};

  // title
  qs('#deal-title').textContent = d.title || 'Title';

  // author line
  qs('#author-name').textContent = d.username || 'anonymous';
  qs('#posted-time').textContent = d.created_at ? ('posted ' + fmt(d.created_at)) : '';
  setAuthorBadge(d);

  // price + discount
  var mrp = d.original_price != null ? parseMoneyNumber(d.original_price)
           : (d.mrp != null ? parseMoneyNumber(d.mrp) : null);
  var priceNum = parseMoneyNumber(d.price);
  var pct = (mrp != null && priceNum != null) ? Math.max(0, Math.round((1 - (priceNum / mrp)) * 100)) : null;
  qs('#deal-price').textContent = priceNum != null ? ('₹' + priceNum.toFixed(2)) : '—';
  qs('#deal-discount').textContent = (pct != null) ? (pct + '% off') : '';

  // CTA + stats
  var url = d.deal_url || d.url || d.cta_url || '#';
  qs('#deal-cta').href = url;
  var up = Number(d.upvotes||0), down = Number(d.downvotes||0);
  var su = qs('#stat-up'); if(su) su.textContent = up;
  var cu = qs('#cnt-up'), cd = qs('#cnt-down'); if(cu) cu.textContent = up; if(cd) cd.textContent = down;
  qs('#stat-views').textContent = d.views || 0;

  // summary / tags / description
  qs('#deal-summary').textContent = d.summary || '';
  qs('#deal-description').textContent = d.description || '';
  var tags = (d.tags || []).map(function(t){ return '<span class="tag">#' + esc(t) + '</span>'; }).join('');
  qs('#tags').innerHTML = tags;

  // gallery
  var imgs = Array.isArray(d.images) && d.images.length ? d.images : (d.thumbnail ? [d.thumbnail] : []);
  var hero = qs('#hero-img');
  if(hero){ hero.setAttribute('data-title', d.title || 'Deal'); hero.onerror=function(){ imgFallback(hero); }; }
  hero.src = (imgs[0] || './uploads/default.jpg');
  var thumbs = qs('#thumbs');
  if (!imgs.length){
    if (thumbs) thumbs.style.display = 'none';
  } else {
    if (thumbs) thumbs.style.display = 'grid';
    var three = imgs.slice(0,3);
    while (three.length < 3) three.push('');
    thumbs.innerHTML = three.map(function(src, i){
      return src ? '<img data-i="'+i+'" src="'+src+'" onerror="imgFallback(this)" data-title="'+(d.title||'Deal')+'" class="'+(i===0?'active':'')+'">'
                 : '<div class="ph" data-i="'+i+'"></div>';
    }).join('');
    thumbs.addEventListener('click', function(e){
      var img = e.target.closest('img'); if(!img) return;
      var i = Number(img.getAttribute('data-i'));
      qsa('#thumbs img').forEach(function(n){ n.classList.remove('active'); });
      img.classList.add('active');
      hero.src = three[i];
    });
  }
}

async function sendVote(kind){
  if (!window.__IS_LOGGED_IN__) { promptLogin('vote'); return; }
  var res = await fetch(API('vote.php'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deal_id: DEAL_ID, value: kind })
  });
  var j = await res.json().catch(function(){ return {}; });
  if(!j.ok){ alert(j.error || 'Vote failed'); return; }
  try{
    var r = await fetch(API('get_deal.php?id=' + DEAL_ID));
    var d = (await r.json()).deal;
    var up = Number(d.upvotes||0), down = Number(d.downvotes||0);
    var su = qs('#stat-up'); if(su) su.textContent = up;
    var cu = qs('#cnt-up'), cd = qs('#cnt-down'); if(cu) cu.textContent = up; if(cd) cd.textContent = down;
  }catch(e){}
}
qs('#btn-up').addEventListener('click', function(){ if(!window.__IS_LOGGED_IN__){ promptLogin('vote'); return; } sendVote('up'); });
qs('#btn-down').addEventListener('click', function(){ if(!window.__IS_LOGGED_IN__){ promptLogin('vote'); return; } sendVote('down'); });

// report fake
qs('#btn-fake').addEventListener('click', async function(){
  var username = localStorage.getItem('username') || '';
  if(!username){ alert('Please log in to report.'); return; }
  try{
    var body = { deal_id: DEAL_ID, action: 'report', username: username, reason: 'fake', reason_text: 'UI report' };
    var res = await fetch(API('report_abuse.php'), { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    var j = await res.json();
    if(!j.success){ alert(j.error || 'Report failed'); } else { alert('Thanks for reporting.'); }
  }catch(e){ alert('Report failed'); }
});

// comments
async function loadComments(){
  var r = await fetch(API('get_comments.php?id=' + DEAL_ID)); var j = await r.json();
  var list = qs('#comments-list');
  if(!j.success || !(j.comments || []).length){ list.innerHTML = ''; return; }
  list.innerHTML = (j.comments || []).map(function(c){
    return '<div class="comment">'
      + '<div class="avatar"></div>'
      + '<div><div class="meta"><b>' + esc(c.username || 'user') + '</b> • ' + fmt(c.created_at) + '</div>'
      + '<div class="body">' + esc(c.comment || c.text || '') + '</div></div>'
      + '</div>';
  }).join('');
}
qs('#comment-send').addEventListener('click', async function(){
  if (!window.__IS_LOGGED_IN__) { promptLogin('comment'); return; }
  var username = localStorage.getItem('username') || '';
  var txt = qs('#comment-text').value.trim(); if(!txt) return;
  var res = await fetch(API('post_comment.php'), { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username: username, deal_id: DEAL_ID, comment: txt }) });
  var j = await res.json();
  if(!j.success){ alert(j.error || 'Comment failed'); return; }
  qs('#comment-text').value=''; loadComments();
});

// share
qs('#btn-share').addEventListener('click', function(){
  var url = location.href;
  var title = qs('#deal-title').textContent || 'Deal';
  if (navigator.share){
    navigator.share({title:title, url:url}).catch(function(){});
  } else {
    try{ navigator.clipboard.writeText(url); alert('Link copied'); }catch(e){ alert(url); }
  }
});

// bookmark sync + toggle
async function syncBookmark(){
  var btn = qs('#bookmark-btn'); if(!btn) return;
  var username = localStorage.getItem('username') || '';
  if(!username){ btn.dataset.on='0'; btn.classList.remove('active'); return; }
  try{
    var res = await fetch(API('check_bookmark.php?username='+encodeURIComponent(username)+'&deal_id='+DEAL_ID));
    var j = await res.json();
    var on = j.success && j.bookmarked;
    btn.dataset.on = on ? '1':'0';
    btn.classList.toggle('active', !!on);
  }catch(e){}
}
qs('#bookmark-btn').addEventListener('click', async function(){
  var username = localStorage.getItem('username') || '';
  if(!username){ alert('Please log in to bookmark.'); return; }
  try{
    await fetch(API('toggle_bookmark.php'), { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username: username, deal_id: DEAL_ID }) });
    await syncBookmark();
  if (!window.__IS_LOGGED_IN__) { var ta = qs('#comment-text'); if (ta) ta.placeholder = 'Log in to comment'; }
  }catch(e){}
});

// boot
(async function(){
  if(!DEAL_ID){ document.body.innerHTML = '<p style="padding:24px">Missing deal id</p>'; return; }
  window.__IS_LOGGED_IN__ = await isLoggedIn();
  window.__IS_LOGGED_IN__ = await isLoggedIn();
  await loadDeal();
  await loadComments();
  // Mark guarded elements so the global capture blocks them for guests
  (function(){
    var up = qs('#btn-up'), down = qs('#btn-down'), send = qs('#comment-send'), ta = qs('#comment-text');
    var cu = qs('#cnt-up'), cd = qs('#cnt-down');
    [up,down,send,ta,cu,cd].forEach(function(el){ if(!el) return; el.setAttribute('data-requires-login','1'); });
    if(up) up.setAttribute('data-login-action','vote');
    if(down) down.setAttribute('data-login-action','vote');
    if(cu) cu.setAttribute('data-login-action','vote');
    if(cd) cd.setAttribute('data-login-action','vote');
    if(send) send.setAttribute('data-login-action','comment');
    if(ta){
      ta.setAttribute('data-login-action','comment');
      if(!window.__IS_LOGGED_IN__){
        ta.readOnly = true; // block typing but allow focus to show modal
        ta.classList.add('guest-readonly');
        ta.placeholder = 'Log in to comment';
      }
    }
    // Explicitly guard counter clicks (belt-and-suspenders)
    function guard(el, act){ if(!el) return; el.addEventListener('click', function(e){ if(!window.__IS_LOGGED_IN__){ e.preventDefault(); e.stopPropagation(); promptLogin(act); }}, true); }
    guard(cu, 'vote'); guard(cd, 'vote');
  })();
await syncBookmark();
  if (!window.__IS_LOGGED_IN__) { var ta = qs('#comment-text'); if (ta) ta.placeholder = 'Log in to comment'; }
})();
