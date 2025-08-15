function escapeHTML(s){ s=String(s==null?'':s); return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
// Script to populate leaderboard
document.addEventListener('DOMContentLoaded', () => {
  fetch('api/get_leaderboard.php')
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById('leaderboard-body');
      tbody.innerHTML = '';
      data.forEach((row, idx) => {
        const tr = document.createElement('tr');
        const rank = document.createElement('td');
        rank.textContent = idx + 1;
        const userTd = document.createElement('td');
        userTd.innerHTML = row.username;
        if (row.is_verified) {
          userTd.innerHTML += ' <span title="Verified user">✔️</span>';
        }
        if (row.is_verified_business) {
          userTd.innerHTML += ' <span title="Verified business">🏢</span>';
        }
        const dealsTd = document.createElement('td');
        dealsTd.textContent = row.deals_count;
        const verTd = document.createElement('td');
        verTd.textContent = row.is_verified_business ? 'Business' : (row.is_verified ? 'User' : '');
        tr.appendChild(rank);
        tr.appendChild(userTd);
        tr.appendChild(dealsTd);
        tr.appendChild(verTd);
        tbody.appendChild(tr);
      });
    });
});