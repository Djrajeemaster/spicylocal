<?php
session_start();
require_once __DIR__ . '/config/db.php';
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'super_admin') {
    header('Location: /bagit/login_unified.php');
    exit;
}
?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Super Admin</title>
  <link rel="stylesheet" href="/bagit/style.css"/>
  <link rel="stylesheet" href="/bagit/header.css"/>
  <link rel="stylesheet" href="/bagit/admin/superadmin.css"/>
  <script src="/bagit/loadHeader.v2.js?v=absfix2" defer></script>
  <script src="/bagit/admin/superadmin.js?v=sa3" defer></script>
</head>
<body>
  <div id="global-header"></div>
  <div class="sa-wrap">
    <aside class="sa-sidebar">
      <div class="sa-brand">Super Admin</div>
      <nav class="sa-nav">
        <button type="button" class="sa-link active" data-tab="deals">Manage Deals</button>
        <button type="button" class="sa-link" data-tab="features">Manage Features</button>
        <button type="button" class="sa-link" data-tab="users">User Management</button>
        <button type="button" class="sa-link" data-tab="banners">Manage Banners</button>
        <button type="button" class="sa-link" data-tab="tax">Categories & Badges</button>
      </nav>
      <div class="sa-footer">
        <button class="btn sa-danger" id="logout-btn">Logout</button>
      </div>
    </aside>

    <main class="sa-main">
      <section id="panel-deals" class="sa-panel sa-card sa-shell">
        <div class="sa-row" style="justify-content:space-between;align-items:center;">
          <button id="sa-toggle" class="sa-toggle" aria-label="Toggle menu">☰</button>
          <h2>Manage Deals</h2>
          <div class="sa-row">
            <select id="deals-status" class="input">
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved" selected>Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select id="deals-category" class="input"><option value="">All Categories</option></select>
            <input id="deals-search" class="input" placeholder="Search title..." />
          </div>
        </div>
        <div class="sa-row" style="justify-content:space-between;margin:8px 0 12px;">
          <div class="muted"></div>
          <div class="sa-row">
            <button id="deals-prev" class="btn">Prev</button>
            <span id="deals-page" style="min-width:60px;text-align:center;">1</span>
            <button id="deals-next" class="btn">Next</button>
          </div>
        </div>
        <table class="table" id="deals-table">
          <thead>
            <tr>
              <th>ID</th><th>Title</th><th>User</th><th>Status</th><th>Votes</th>
              <th>Feedback</th><th>Comments</th><th>Pin</th><th>Actions</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </section>

      <section id="panel-features" class="sa-panel sa-card hidden">
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

      <section id="panel-users" class="sa-panel sa-card hidden">
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

      <section id="panel-banners" class="sa-panel sa-card hidden">
        <h2>Manage Banners</h2>
        <p class="muted">Future-ready. We can wire this to a banners table and placement zones next.</p>
      </section>

      <section id="panel-tax" class="sa-panel sa-card hidden">
        <h2>Categories & Badges</h2>
        <p class="muted">We’ll add CRUD for categories and badges here. If you want, I’ll ship DB migrations in the next drop.</p>
      </section>
    </main>
  </div>
  <div class="sa-scrim" id="sa-scrim"></div>
</body>
</html>
