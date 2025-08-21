// SA v-railfix1

// superadmin.js v4 — all endpoints under /bagit/api/*
(function(){
  console.log('[SA] superadmin.js v4 live');
  const $  = (s, ctx=document) => ctx.querySelector(s);
  const $$ = (s, ctx=document) => Array.from(ctx.querySelectorAll(s));

  const API = {
    flags: '/bagit/api/feature_flags.php',
    audit: '/bagit/api/audit_log.php',
    usersList: '/bagit/api/users_list.php',
    mute: '/bagit/api/mute_user.php',
    updateRole: '/bagit/api/update_role.php',
    verifyBiz: '/bagit/api/verify_business.php',
    dealsList: '/bagit/api/deals_list.php',
    statusUpdate: '/bagit/api/update_status.php',
    pinToggle: '/bagit/api/pin_toggle.php',
    deleteDeal: '/bagit/api/delete_deal.php',
    editDeal: (id) => `/bagit/admin/edit.php?id=${id}`,
    viewComments: (id) => `/bagit/admin/view_comments.php?id=${id}`
  };

  function setActive(tab){
    $$('.sa-link').forEach(el=>el.classList.remove('active'));
    const btn = document.querySelector(`[data-tab="${tab}"]`);
    if (btn) btn.classList.add('active');
    $$('.sa-panel').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById('panel-'+tab);
    if (target) target.classList.remove('hidden');
  }

  // ---- Features ----
  async function loadFlags(){
    const tbody = document.getElementById('flags-tbody'); if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="2">Loading…</td></tr>';
    try{
      const r = await fetch(API.flags); const flags = await r.json();
      tbody.innerHTML='';
      Object.keys(flags||{}).forEach(name=>{
        if (name.startsWith('_')) return;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${name}</td><td><input type="checkbox" ${flags[name] ? 'checked' : ''}></td>`;
        tr.querySelector('input').addEventListener('change', async (e) => {
          await fetch(API.flags, {method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({feature_name:name, is_enabled: e.target.checked?1:0})});
          loadAudit();
        });
        tbody.appendChild(tr);
      });
    }catch{ tbody.innerHTML = '<tr><td colspan="2">Failed to load flags</td></tr>'; }
  }
  async function loadAudit(){
    const tbody = document.getElementById('audit-body'); if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4">Loading…</td></tr>';
    try{
      const r = await fetch(API.audit); const rows = await r.json();
      tbody.innerHTML = (rows||[]).map(x=>`<tr>
        <td>${x.timestamp||''}</td><td>${x.admin_user||''}</td><td>${x.action||''}</td><td>${x.details||''}</td>
      </tr>`).join('');
    }catch{ tbody.innerHTML = '<tr><td colspan="4">Failed to load logs</td></tr>'; }
  }

  // ---- Users ----
  async function loadUsers(){
    const tbody = document.getElementById('users-tbody'); if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6">Loading…</td></tr>';
    try{
      const r = await fetch(API.usersList); const rows = await r.json();
      tbody.innerHTML = (rows||[]).map(u => {
        const checked = String(u.is_verified_business||'0')==='1' ? 'checked' : '';
        const muted   = String(u.is_muted||'0')==='1' ? 'checked' : '';
        return `<tr>
          <td>${u.username}</td>
          <td>
            <select data-username="${u.username}" class="role-dd">
              ${['user','moderator','admin','super_admin'].map(r=>`<option value="${r}" ${u.role===r?'selected':''}>${r}</option>`).join('')}
            </select>
          </td>
          <td><label><input type="checkbox" class="vbz" data-username="${u.username}" ${checked}> Business</label></td>
          <td><label><input type="checkbox" class="mute" data-username="${u.username}" ${muted}> Muted</label></td>
          <td></td>
        </tr>`;
      }).join('');
      document.querySelectorAll('#panel-users .role-dd').forEach(dd=>{
        dd.addEventListener('change', async ()=>{
          const username = dd.getAttribute('data-username');
          await fetch(API.updateRole, {method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({username, role: dd.value})});
        });
      });
      document.querySelectorAll('#panel-users .vbz').forEach(ch=>{
        ch.addEventListener('change', async ()=>{
          const username = ch.getAttribute('data-username');
          await fetch(API.verifyBiz, {method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({username, is_verified_business: ch.checked?1:0})});
        });
      });
      document.querySelectorAll('#panel-users .mute').forEach(ch=>{
        ch.addEventListener('change', async ()=>{
          const username = ch.getAttribute('data-username');
          const action = ch.checked ? 'mute' : 'unmute';
          await fetch(API.mute, {method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
            body: new URLSearchParams({username, action})});
        });
      });
    }catch{ tbody.innerHTML='<tr><td colspan="6">Failed to load</td></tr>'; }
  }

  // ---- Deals ----
  const DP = { page:1, limit:10, status:'approved', category:'', q:'' };
  async function fetchDeals(){
    const qs = new URLSearchParams({ page:String(DP.page), limit:String(DP.limit),
      status: DP.status||'', category: DP.category||'', q: DP.q||'' });
    const r = await fetch(`${API.dealsList}?${qs.toString()}`, { cache:'no-store' });
    if (!r.ok) throw new Error('fetch failed');
    return await r.json();
  }
  function renderDealsRows(data){
    const tb = document.querySelector('#deals-table tbody'); if (!tb) return;
    const deals = data.deals || [];
    if (!deals.length){ tb.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#6b7280;">No deals found</td></tr>'; return; }
    tb.innerHTML = deals.map(d => {
      const pinIcon = (String(d.is_pinned||'0')==='1') ? '📌' : '📍';
      return `<tr data-id="${d.id}">
        <td>${d.id}</td>
        <td>${d.title||''}</td>
        <td>${d.username||''}</td>
        <td>
          <select class="dd-status">
            ${['pending','approved','rejected'].map(s=>`<option value="${s}" ${d.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </td>
        <td>${d.upvotes||0}</td>
        <td>👍 ${(d.upvotes||0)} &nbsp; 🚫 ${(d.fake||0)}</td>
        <td>${d.comments||0}</td>
        <td><button class="btn btn-pin" title="Pin/Unpin">${pinIcon}</button></td>
        <td class="sa-row">
          <a class="btn btn-edit" href="${API.editDeal(d.id)}" title="Edit">✏️</a>
          <a class="btn btn-comments" href="${API.viewComments(d.id)}" title="Comments">💬</a>
          <button class="btn btn-del" title="Delete">🗑️</button>
        </td>
      </tr>`;
    }).join('');
  }
  async function loadDeals(init=false){
    if (init){
      const s = document.getElementById('deals-status'); if (s) DP.status = s.value || '';
      const q = document.getElementById('deals-search'); if (q) DP.q = q.value.trim();
      const c = document.getElementById('deals-category'); if (c) DP.category = c.value||'';
    }
    try{
      const data = await fetchDeals();
      if (init){
        const catSel = document.getElementById('deals-category');
        if (catSel && catSel.options.length <= 1 && Array.isArray(data.categories)) {
          data.categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.slug || String(cat.id) || '';
            opt.textContent = cat.name || cat.slug || '';
            catSel.appendChild(opt);
          });
        }
      }
      renderDealsRows(data);
      const pageEl = document.getElementById('deals-page');
      if (pageEl) pageEl.textContent = `${data.page||DP.page}/${data.total_pages||'?'}`;
    }catch(e){
      const tb = document.querySelector('#deals-table tbody');
      if (tb) tb.innerHTML = '<tr><td colspan="9">Failed to load deals</td></tr>';
    }
  }
  function wireDeals(){
    const s = document.getElementById('deals-status');
    const q = document.getElementById('deals-search');
    const c = document.getElementById('deals-category');
    const prev = document.getElementById('deals-prev');
    const next = document.getElementById('deals-next');

    s?.addEventListener('change', ()=>{ DP.status = s.value||''; DP.page=1; loadDeals(true); });
    q?.addEventListener('keyup', (e)=>{ if (e.key==='Enter'){ DP.q=q.value.trim(); DP.page=1; loadDeals(true);} });
    c?.addEventListener('change', ()=>{ DP.category=c.value||''; DP.page=1; loadDeals(true); });
    prev?.addEventListener('click', ()=>{ if (DP.page>1){ DP.page--; loadDeals(true);} });
    next?.addEventListener('click', ()=>{ DP.page++; loadDeals(true); });

    const table = document.getElementById('deals-table');
    table?.addEventListener('change', async (e)=>{
      const sel = e.target.closest('.dd-status'); if (!sel) return;
      const tr = e.target.closest('tr'); const id = tr?.getAttribute('data-id');
      if (!id) return;
      const form = new FormData(); form.append('id', id); form.append('status', sel.value);
      const r = await fetch(API.statusUpdate, { method:'POST', body: form, credentials:'same-origin' });
      if (!r.ok){ alert('Update failed'); return; }
    });
    table?.addEventListener('click', async (e)=>{
      const tr = e.target.closest('tr'); const id = tr?.getAttribute('data-id'); if (!id) return;
      if (e.target.closest('.btn-pin')){
        const form = new FormData(); form.append('id', id);
        const r = await fetch(API.pinToggle, { method:'POST', body: form, credentials:'same-origin' });
        if (r.ok) loadDeals(); else alert('Pin toggle failed');
      } else if (e.target.closest('.btn-del')){
        if (!confirm('Delete this deal?')) return;
        const form = new FormData(); form.append('id', id);
        const r = await fetch(API.deleteDeal, { method:'POST', body: form, credentials:'same-origin' });
        if (r.ok) loadDeals(); else alert('Delete failed');
      }
    });
  }

  // expose (safety)
  window.loadDeals = loadDeals; window.wireDeals = wireDeals;
  window.loadUsers = loadUsers; window.loadFlags = loadFlags; window.loadAudit = loadAudit;

  document.addEventListener('DOMContentLoaded', () => {
    // Close possible header dropdown overlay so it won't block clicks
    try{ const dd = document.getElementById('user-dropdown'); if (dd) { dd.classList.add('hidden'); document.addEventListener('click', ()=> dd.classList.add('hidden')); } }catch{}

    // Delegated clicks for sidebar (buttons or anchors)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.sa-link');
      if (!btn) return;
      e.preventDefault(); e.stopPropagation();
      const tab = btn.dataset.tab;
      setActive(tab);
      if (tab==='deals'){ wireDeals(); loadDeals(true); }
      if (tab==='features'){ loadFlags(); loadAudit(); }
      if (tab==='users'){ loadUsers(); }
    });

    // Default
    setActive('deals'); wireDeals(); loadDeals(true);
  });
})();

// === Toggle position fixer ===
(function(){
  let btn = document.getElementById('sa-toggle');
  if (btn && btn.parentElement && btn.parentElement.id === 'panel-deals'){
    document.body.appendChild(btn);
  } else if (!btn){
    btn = document.createElement('button');
    btn.id = 'sa-toggle';
    btn.className = 'sa-toggle';
    btn.setAttribute('aria-label','Toggle menu');
    btn.textContent = '☰';
    document.body.appendChild(btn);
  }
  btn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); }, true);
})();
// === Sidebar controller: hidden ↔ rail; long-press/Shift+M => expanded overlay ===
(function(){
  const root = document.documentElement;
  const KEY  = 'saSidebarState';              // 'hidden' | 'rail' | 'expanded'

  // Make sure the sidebar element has the expected class
  (function ensureSidebarClass(){
    if (!document.querySelector('.sa-sidebar')) {
      const guess = document.querySelector('aside, #leftNav, .left-nav, .sa-left');
      if (guess) guess.classList.add('sa-sidebar');
    }
  })();

  function apply(state){
    root.classList.remove('sa-hidden','sa-rail','sa-has-scrim');
    if (state === 'expanded') root.classList.add('sa-has-scrim');
    else if (state === 'rail') root.classList.add('sa-rail');
    else root.classList.add('sa-hidden');           // default full-screen deals
    localStorage.setItem(KEY, state);
  }
  const current = () => localStorage.getItem(KEY) || 'hidden';
  const next    = (s) => (s === 'rail' ? 'hidden' : 'rail');

  // Ensure toggle + scrim exist and live under <body>
  function ensureUI(){
    let btn = document.getElementById('sa-toggle');
    if (!btn){
      btn = document.createElement('button');
      btn.id = 'sa-toggle';
      btn.className = 'sa-toggle';
      btn.setAttribute('aria-label','Toggle menu');
      btn.textContent = '☰';
      document.body.appendChild(btn);
    } else if (btn.parentElement && btn.parentElement.id === 'panel-deals'){
      // never inside the panel
      document.body.appendChild(btn);
    }
    let scrim = document.getElementById('sa-scrim');
    if (!scrim){
      scrim = document.createElement('div');
      scrim.id = 'sa-scrim';
      scrim.className = 'sa-scrim';
      document.body.appendChild(scrim);
    }
    // Don't let toggle clicks bubble into the table
    btn.addEventListener('click', e => { e.stopPropagation(); }, true);
  }

  function init(){
    ensureUI();
    apply(current());

    // Click: hidden <-> rail
    document.addEventListener('click', (e)=>{
      const t = e.target.closest('#sa-toggle');
      if (t){ e.preventDefault(); apply(next(current())); }
      if (e.target && e.target.id === 'sa-scrim'){ apply('hidden'); }
    });

    // Long-press toggle => expanded overlay
    let pressTimer = null;
    document.addEventListener('mousedown', (e)=>{
      if (e.target.closest('#sa-toggle')){
        pressTimer = setTimeout(()=> apply('expanded'), 400);
      }
    });
    ['mouseup','mouseleave'].forEach(ev=>document.addEventListener(ev, ()=>{
      if (pressTimer){ clearTimeout(pressTimer); pressTimer = null; }
    }));

    // Keyboard: m toggles hidden<->rail, Shift+M opens overlay
    window.addEventListener('keydown', (e)=>{
      if (e.key === 'M' && e.shiftKey) apply('expanded');
      else if (e.key === 'm' || e.key === 'M') apply(next(current()));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
