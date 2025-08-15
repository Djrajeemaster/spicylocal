
// moderation.js — front-end queue viewer for reports
(function(){
  const API_QUEUE = "/bagit/api/moderation_queue.php";       // expects JSON list of reports
  const API_ACTION = "/bagit/api/moderation_action.php";     // expects {success:true}
  const tbody = document.getElementById('mod-tbody');
  const search = document.getElementById('mod-search');
  const refreshBtn = document.getElementById('refresh');

  function escapeHtml(s){ return (s||'').toString().replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

  function row(r){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div><strong>${escapeHtml(r.deal_title||('Deal #'+r.deal_id))}</strong></div>
        <div class="muted">#${escapeHtml(r.deal_id)} by ${escapeHtml(r.deal_owner||'')}</div>
      </td>
      <td>${escapeHtml(r.reporter||'')}</td>
      <td><span class="pill pill-red">${escapeHtml(r.reason||'reported')}</span></td>
      <td class="muted">${escapeHtml(r.created_at||'')}</td>
      <td>
        <div class="mod-acts">
          <button class="btn" data-act="ok" data-id="${escapeHtml(r.id)}">Mark OK</button>
          <button class="btn" data-act="remove" data-id="${escapeHtml(r.id)}">Remove</button>
          <button class="btn" data-act="ban" data-id="${escapeHtml(r.id)}">Ban User</button>
          <button class="btn" data-act="escalate" data-id="${escapeHtml(r.id)}">Escalate</button>
        </div>
      </td>
    `;
    return tr;
  }

  function render(list){
    tbody.innerHTML='';
    if (!list || !list.length){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" class="muted">No reports.</td>`;
      tbody.appendChild(tr);
      return;
    }
    list.forEach(r => tbody.appendChild(row(r)));
  }

  function fetchQueue(){
    tbody.innerHTML = `<tr><td colspan="5" class="muted">Loading…</td></tr>`;
    fetch(API_QUEUE).then(r=>r.json()).then(data=>{
      const items = Array.isArray(data) ? data : (data.items || []);
      render(items);
    }).catch(()=>{
      tbody.innerHTML = `<tr><td colspan="5" class="muted">Failed to load queue.</td></tr>`;
    });
  }

  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('button.btn[data-act]');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const act = btn.getAttribute('data-act');
    btn.disabled = true;
    fetch(API_ACTION, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id, action: act })
    }).then(r=>r.json()).then(resp=>{
      if (resp && resp.success){
        fetchQueue();
      }else{
        alert((resp && resp.error) || 'Action failed');
      }
    }).catch(()=> alert('Network error')).finally(()=> btn.disabled=false);
  });

  refreshBtn && refreshBtn.addEventListener('click', fetchQueue);
  search && search.addEventListener('input', () => {
    const q = search.value.toLowerCase();
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(tr => {
      const txt = tr.textContent.toLowerCase();
      tr.style.display = txt.includes(q) ? '' : 'none';
    });
  });

  document.addEventListener('DOMContentLoaded', fetchQueue);
  fetchQueue();
})();
