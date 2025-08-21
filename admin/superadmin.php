<?php
session_start();
require_once __DIR__ . '/config/db.php';
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'super_admin') {
    header('Location: /bagit/login.php');
    exit;
}
?><!DOCTYPE html>

<html lang="en">
<!-- THEME BOOT: put before CSS to avoid FOUC -->
<script>
(function(){
  try{
    var ls = localStorage.getItem('sb_theme');
    if(ls){
      var t = JSON.parse(ls);
      var c = t.brand || t.color;
      if(c){
        var r = document.documentElement;
        r.style.setProperty('--sb-accent', c);
        r.style.setProperty('--sb-primary', c);
      }
    }
  }catch(e){}
})();
</script>

<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Super Admin</title>
<link href="/bagit/style.css" rel="stylesheet"/>
<link href="/bagit/header.css" rel="stylesheet"/>
<link href="/bagit/admin/superadmin.css" rel="stylesheet"/>
<script defer="" src="/bagit/loadHeader.v2.js?v=absfix2"></script>
<script defer="" src="/bagit/admin/superadmin.js?v=sa3"></script>
<script>/* rail-preload */try{if(!localStorage.getItem('saSidebarState'))localStorage.setItem('saSidebarState','rail');}catch(e){}</script>
</head>
<body>
<div id="global-header"></div>

<div class="sa-scrim" hidden="" id="saScrim"></div>
<div class="sa-wrap">
<aside class="sa-sidebar sa-rail" id="saSidebar">
<div class="sa-brand">🛡️ Super Admin</div>
<nav class="sa-nav">
<button class="sa-link active" data-tab="deals" type="button"><span class="item-icon">🏷️</span><span class="item-text">Manage Deals</span></button>
<button class="sa-link" data-tab="features" type="button"><span class="item-icon">🎚️</span><span class="item-text">Manage Features</span></button>
<button class="sa-link" data-tab="users" type="button"><span class="item-icon">👥</span><span class="item-text">User Management</span></button>
<button class="sa-link" data-tab="banners" type="button"><span class="item-icon">🖼️</span><span class="item-text">Manage Banners</span></button>
<button class="sa-link" data-tab="tax" type="button"><span class="item-icon">🏷</span><span class="item-text">Categories &amp; Badges</span></button>
</nav>
<div class="sa-footer">
</div>
</aside>
<main class="sa-main">
<section class="sa-panel sa-card" id="panel-deals">
<div class="sa-row" style="justify-content:space-between;align-items:center;">
<h2>Manage Deals</h2>
<div class="sa-row">
<select class="input" id="deals-status">
<option value="">All</option>
<option value="pending">Pending</option>
<option selected="" value="approved">Approved</option>
<option value="rejected">Rejected</option>
</select>
<select class="input" id="deals-category"><option value="">All Categories</option></select>
<input class="input" id="deals-search" placeholder="Search title..."/>
</div>
</div>
<div class="sa-row" style="justify-content:space-between;margin:8px 0 12px;">
<div class="muted"></div>
<div class="sa-row">
<button class="btn" id="deals-prev">Prev</button>
<span id="deals-page" style="min-width:60px;text-align:center;">1</span>
<button class="btn" id="deals-next">Next</button>
</div>
</div>
<table class="table" id="deals-table">
<thead>
<tr>
<th>ID</th><th>Title</th><th>User</th><th>Status</th><th>Votes / Reports</th>
<th>Reports</th><th>Comments</th><th>Pin</th><th>Actions</th>
</tr>
</thead>
<tbody></tbody>
</table>
</section>
<section class="sa-panel sa-card hidden" id="panel-features">
<div class="sa-row" style="justify-content:space-between;">
<h2>Feature Flags</h2>
</div>
<table class="table">
<thead><tr><th>Feature</th><th>Enabled</th></tr></thead>
<tbody id="flags-tbody"></tbody>
</table>
<div class="sa-card">
<h3>Audit Log</h3>
<table class="table">
<thead><tr><th>Timestamp</th><th>Admin</th><th>Action</th><th>Details</th></tr></thead>
<tbody id="audit-body"></tbody>
</table>
</div>
</section>
<section class="sa-panel sa-card hidden" id="panel-users">
<div class="sa-row" style="justify-content:space-between;">
<h2>User Management</h2>
</div>
<table class="table">
<thead>
<tr><th>User</th><th>Role</th><th>Verified</th><th>Muted</th><th></th></tr>
</thead>
<tbody id="users-tbody"></tbody>
</table>
</section>
<section class="sa-panel sa-card hidden" id="panel-banners">
<h2>Manage Banners</h2>
<p class="muted">Future-ready. We can wire this to a banners table and placement zones next.</p>
</section>
<section class="sa-panel sa-card hidden" id="panel-tax">
<h2>Categories &amp; Badges</h2>
<p class="muted">We’ll add CRUD for categories and badges here. If you want, I’ll ship DB migrations in the next drop.</p>
</section>
</main>
</div>
<script>
(function(){
  const root    = document.documentElement;
  const scrim   = document.getElementById('saScrim');
  const toggle  = document.getElementById('saToggle');
  const MODE_KEY = 'sa.superadmin.sidebar.mode'; // 'rail' | 'hidden'
  const mode = localStorage.getItem(MODE_KEY) || 'rail';
  root.classList.toggle('sa-rail',   mode === 'rail');
  root.classList.toggle('sa-hidden', mode === 'hidden');

  function openOverlay(){ root.classList.add('sa-has-scrim'); scrim.hidden = false; }
  function closeOverlay(){ root.classList.remove('sa-has-scrim'); scrim.hidden = true; }

  toggle?.addEventListener('click', () => {
    if (root.classList.contains('sa-has-scrim')) closeOverlay(); else openOverlay();
  });
  scrim?.addEventListener('click', closeOverlay);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeOverlay(); });

  // Expose helper to switch between 'rail' (icons only) and 'hidden'
  window.SA = {
    setMode(next){ localStorage.setItem(MODE_KEY, next);
      root.classList.toggle('sa-rail',   next === 'rail');
      root.classList.toggle('sa-hidden', next === 'hidden');
    }
  };
})();
</script>
</body>
</html>
