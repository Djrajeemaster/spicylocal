// verified_business_dashboard.js
// Provides functionality for the Verified Business Dashboard page. This file
// checks that the user is a verified business, fetches and displays the
// business's own deals, and provides simple tab navigation.

document.addEventListener('DOMContentLoaded', () => {
  // Check if the user is a verified business. If not, redirect to home.
  const isVerified = localStorage.getItem('is_verified_business');
  if (!isVerified || (isVerified !== '1' && isVerified !== 'true')) {
    alert('Access denied: Verified Business only');
    window.location.href = 'index.html';
    return;
  }

  const username = localStorage.getItem('username') || '';
  const dealsContainer = document.querySelector('[data-content="deals"]');
  const tabs = document.querySelectorAll('#vb-tabs button');
  const contentSections = document.querySelectorAll('#vb-content > div');

  // Tab switching logic
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      // Set active tab
      tabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      const tabName = btn.getAttribute('data-tab');
      // Show corresponding content
      contentSections.forEach(section => {
        if (section.getAttribute('data-content') === tabName) {
          section.classList.add('active');
        } else {
          section.classList.remove('active');
        }
      });
      // If switching to deals tab and not loaded yet, fetch deals
      if (tabName === 'deals' && !dealsContainer.dataset.loaded) {
        fetchDeals();
      }
    });
  });

  // Fetch and render the business's deals
  function fetchDeals() {
    if (!username) {
      dealsContainer.innerHTML = '<p>Unable to determine user.</p>';
      return;
    }
    fetch(`api/get_user_deals.php?username=${encodeURIComponent(username)}`)
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          dealsContainer.innerHTML = '<p>Failed to load deals.</p>';
          return;
        }
        const deals = data.deals || [];
        if (deals.length === 0) {
          dealsContainer.innerHTML = '<p>No deals posted yet.</p>';
          return;
        }
        // Build a simple table of deals
        let html = '<table class="vb-table"><thead><tr><th>ID</th><th>Title</th><th>Status</th><th>Created</th></tr></thead><tbody>';
        deals.forEach(d => {
          const status = d.status || 'pending';
          const created = d.created_at || '';
          html += `<tr><td>${d.id}</td><td>${d.title}</td><td>${status}</td><td>${created}</td></tr>`;
        });
        html += '</tbody></table>';
        dealsContainer.innerHTML = html;
        dealsContainer.dataset.loaded = '1';
      })
      .catch(() => {
        dealsContainer.innerHTML = '<p>Error loading deals.</p>';
      });
  }

  // Load deals by default when landing on dashboard
  fetchDeals();
});

// PATCH(chart): init only if authenticated; safe JSON parse; lazy load Chart.js
(async function __initDashChart(){
  const canvas = document.getElementById('dashChart');
  if(!canvas) return;
  async function getJSON(url){
    const r = await fetch(url, {credentials:'include', cache:'no-store'});
    const tx = await r.text();
    try{ return {ok:r.ok, status:r.status, data: JSON.parse(tx)}; }
    catch(e){ console.error('Bad JSON', url, tx); return {ok:false, status:r.status, data:null}; }
  }
  const me = await getJSON('api/me.php');
  if(!me.ok || !me.data || !me.data.ok){ console.warn('No session for dashboard chart'); return; }

  const ts = await getJSON('api/get_user_timeseries.php');
  if(!ts.ok || !ts.data){ console.warn('No timeseries'); return; }
  const rows = Array.isArray(ts.data.series) ? ts.data.series : [];
  if(!rows.length){ console.warn('Empty series'); return; }

  async function ensureChartJS(){
    if(window.Chart) return;
    await new Promise((ok,err)=>{ const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js'; s.onload=ok; s.onerror=err; document.head.appendChild(s); });
  }
  await ensureChartJS();

  const labels = rows.map(r=>r.date);
  const views = rows.map(r=>Number(r.views||0));
  const clicks = rows.map(r=>Number(r.clicks||0));

  if(canvas.__chart) canvas.__chart.destroy();
  const dark = document.body.classList.contains('dark');
  const grid = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const text = dark ? '#e0e0e0' : '#333';

  const ctx = canvas.getContext('2d');
  canvas.__chart = new Chart(ctx, {
    type:'line',
    data:{
      labels,
      datasets:[
        {label:'Views', data:views, tension:0.3, borderWidth:2, pointRadius:0},
        {label:'Clicks', data:clicks, tension:0.3, borderWidth:2, pointRadius:0}
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      scales:{ x:{grid:{color:grid},ticks:{color:text}}, y:{grid:{color:grid},ticks:{color:text},beginAtZero:true}},
      plugins:{ legend:{labels:{color:text}}, tooltip:{mode:'index',intersect:false} }
    }
  });
})();