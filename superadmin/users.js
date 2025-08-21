
(async function(){
  async function guard(){
    const r = await fetch('../api/auth/profile.php', {credentials:'include', cache:'no-store'});
    const me = await r.json().catch(()=>({}));
    if (!me || me.role !== 'super_admin') {
      document.body.innerHTML = '<p>Forbidden. Super Admin only.</p>';
      throw new Error('forbidden');
    }
  }
  async function fetchUsers(q=''){
    const r = await fetch('../api/users_list.php?q=' + encodeURIComponent(q), {cache:'no-store', credentials:'include'});
    if (!r.ok) throw new Error('load_failed');
    return r.json();
  }
  async function updateRole(id, role){
    const r = await fetch('../api/user_update_role.php', {
      method:'POST', headers:{'Content-Type':'application/json'},
      credentials:'include',
      body: JSON.stringify({ id, role })
    });
    return r.json();
  }
  function render(rows){
    const el = document.getElementById('app');
    if (!Array.isArray(rows) || rows.length===0) {
      el.innerHTML = '<p>No users found.</p>'; return;
    }
    const roles = ['user','admin','super_admin','moderator','business'];
    el.innerHTML = [
      '<table>',
        '<thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Verified Biz</th><th>Muted</th><th class="actions">Actions</th></tr></thead>',
        '<tbody>',
          rows.map(u => [
            '<tr data-id="', u.id, '">',
              '<td>', u.id, '</td>',
              '<td>', escapeHtml(u.username||''), '</td>',
              '<td>', escapeHtml(u.email||''), '</td>',
              '<td class="role"><select class="role-sel">',
                roles.map(r => '<option value="'+r+'" '+(u.role===r?'selected':'')+'>'+r+'</option>').join(''),
              '</select></td>',
              '<td>', u.is_verified_business? 'Yes':'No', '</td>',
              '<td>', u.is_muted? 'Yes':'No', '</td>',
              '<td class="actions"><button class="btn save">Save</button></td>',
            '</tr>'
          ].join('')).join(''),
        '</tbody>',
      '</table>'
    ].join('');
    el.querySelectorAll('.save').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const tr = e.target.closest('tr'); const id = Number(tr.dataset.id);
        const sel = tr.querySelector('.role-sel'); const role = sel.value;
        const res = await updateRole(id, role);
        if (!res || res.ok !== true) { alert('Update failed'); return; }
        btn.textContent = 'Saved'; btn.classList.add('muted'); setTimeout(()=>{ btn.textContent='Save'; btn.classList.remove('muted'); }, 900);
      });
    });
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  document.getElementById('refresh').addEventListener('click', async()=>{
    const q = document.getElementById('q').value.trim(); render(await fetchUsers(q));
  });
  document.getElementById('q').addEventListener('input', async()=>{
    const q = document.getElementById('q').value.trim(); render(await fetchUsers(q));
  });

  await guard();
  render(await fetchUsers(''));
})();
