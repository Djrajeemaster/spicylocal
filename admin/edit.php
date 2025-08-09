<?php
// EDIT-PAGE-V4 — styled + stateful redirect to Super Admin Manage Deals
require_once __DIR__ . '/config/auth_check.php';
require_once __DIR__ . '/config/db.php';

$id = (int)($_GET['id'] ?? 0);

// Capture list-state from query (or POST on submit) so we can return to the same tab/page/filters
$statusFilter   = $_GET['status']   ?? ($_POST['status_filter']   ?? '');
$categoryFilter = $_GET['category'] ?? ($_POST['category_filter'] ?? '');
$qFilter        = $_GET['q']        ?? ($_POST['q_filter']        ?? '');
$pageNum        = (int)($_GET['page'] ?? ($_POST['page'] ?? 1));

// fetch deal
$stmt = $pdo->prepare('SELECT id,title,description,category,status FROM deals WHERE id=?');
$stmt->execute([$id]);
$deal = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$deal) { http_response_code(404); echo '<!doctype html><body>Deal not found.</body>'; exit; }

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
  $title = $_POST['title'] ?? '';
  $description = $_POST['description'] ?? '';
  $category = $_POST['category'] ?? '';
  $status = $_POST['status'] ?? '';

  $upd = $pdo->prepare('UPDATE deals SET title=?, description=?, category=?, status=? WHERE id=?');
  $upd->execute([$title, $description, $category, $status, $id]);

  // Redirect back to Super Admin Manage Deals with preserved filters + page
  $qs = http_build_query([
    'tab'      => 'deals',
    'status'   => $statusFilter,
    'category' => $categoryFilter,
    'q'        => $qFilter,
    'page'     => max(1, $pageNum),
  ]);
  header('Location: /bagit/admin/superadmin.php?' . $qs);
  exit;
}
?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Edit Deal #<?= htmlspecialchars($deal['id']) ?></title>
  <link rel="stylesheet" href="/bagit/style.css"/>
  <link rel="stylesheet" href="/bagit/header.css"/>
  <link rel="stylesheet" href="/bagit/admin/admin_styles.css"/>
  <style>
    .page-wrap { max-width: 960px; margin: 24px auto; padding: 0 16px; }
    .card { background:#fff; border:1px solid #e5e7eb; border-radius:16px; padding:22px; box-shadow:0 10px 20px rgba(0,0,0,0.04); }
    .card h1 { margin:0 0 6px; font-size:24px; }
    .sub { color:#6b7280; margin-bottom:18px; }
    .grid { display:grid; grid-template-columns: 170px 1fr; gap:14px 16px; align-items:center; }
    .grid label { color:#374151; font-weight:600; }
    .grid input[type="text"], .grid textarea, .grid select { width:100%; padding:10px 12px; border:1px solid #d1d5db; border-radius:10px; font-size:14px; background:#fff; }
    .grid textarea { min-height:140px; resize:vertical; }
    .actions { display:flex; gap:12px; margin-top:18px; justify-content:flex-end; }
    .btn { padding:10px 16px; border:0; border-radius:10px; cursor:pointer; font-weight:600; }
    .btn-primary { background:#ff007a; color:#fff; }
    .btn-secondary { background:#eef2ff; color:#3730a3; text-decoration:none; display:inline-flex; align-items:center; }
    .crumbs { display:flex; align-items:center; gap:8px; margin:12px 0 16px; font-size:14px; }
    .crumbs a { color:#3b82f6; text-decoration:none; }
  </style>
</head>
<body>
  <div id="global-header"></div>

  <div class="page-wrap">
    <div class="crumbs">
      <a href="/bagit/admin/superadmin.php?<?= http_build_query(['tab'=>'deals','status'=>$statusFilter,'category'=>$categoryFilter,'q'=>$qFilter,'page'=>max(1,$pageNum)]) ?>">← Back to Dashboard</a>
      <span>/</span>
      <span>Deal #<?= htmlspecialchars($deal['id']) ?></span>
    </div>

    <div class="card">
      <h1>Edit Deal</h1>
      <div class="sub">Update the details and click Save. Use the status dropdown to approve, reject, or set pending.</div>

      <form method="POST" class="grid" novalidate>
        <!-- keep list-state on submit -->
        <input type="hidden" name="status_filter"   value="<?= htmlspecialchars($statusFilter) ?>">
        <input type="hidden" name="category_filter" value="<?= htmlspecialchars($categoryFilter) ?>">
        <input type="hidden" name="q_filter"        value="<?= htmlspecialchars($qFilter) ?>">
        <input type="hidden" name="page"            value="<?= max(1,$pageNum) ?>">

        <label for="title">Title</label>
        <input id="title" type="text" name="title" value="<?= htmlspecialchars($deal['title']) ?>" required />

        <label for="description">Description</label>
        <textarea id="description" name="description" required><?= htmlspecialchars($deal['description']) ?></textarea>

        <label for="category">Category</label>
        <input id="category" type="text" name="category" value="<?= htmlspecialchars($deal['category']) ?>" />

        <label for="status">Status</label>
        <select name="status" id="status">
          <option value="pending"  <?= $deal['status'] === 'pending'  ? 'selected' : '' ?>>Pending</option>
          <option value="approved" <?= $deal['status'] === 'approved' ? 'selected' : '' ?>>Approved</option>
          <option value="rejected" <?= $deal['status'] === 'rejected' ? 'selected' : '' ?>>Rejected</option>
        </select>

        <div></div>
        <div class="actions">
          <a class="btn btn-secondary" href="/bagit/admin/superadmin.php?<?= http_build_query(['tab'=>'deals','status'=>$statusFilter,'category'=>$categoryFilter,'q'=>$qFilter,'page'=>max(1,$pageNum)]) ?>">Cancel</a>
          <button class="btn btn-primary" type="submit">Save Changes</button>
        </div>
      </form>
    </div>
  </div>

  <script src="/bagit/loadHeader.v2.js?v=absfix2" defer></script>
</body>
</html>
