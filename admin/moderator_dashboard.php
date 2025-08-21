<?php
// Simple Moderator Dashboard
// This page is similar to the admin dashboard but intended for moderators.
// Moderators can review deals and comments but have limited control compared to admins.

session_start();
require_once __DIR__ . '/config/db.php';

// Check that the user is logged in and has the moderator role or is a super admin
if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['moderator', 'super_admin'], true)) {
    // If not authorized, redirect to the unified login page instead of echoing plain text
    header('Location: ../login.php');
    exit;
}

// Fetch latest deals for moderation (e.g. pending approval or reported)
$stmt = $pdo->query(
    "SELECT deals.*, users.username,
        (SELECT COUNT(*) FROM feedback WHERE deal_id = deals.id AND feedback_type = 'fake') AS fake_count,
        (SELECT COUNT(*) FROM comments WHERE deal_id = deals.id) AS comment_count
     FROM deals
     LEFT JOIN users ON deals.user_id = users.id
     ORDER BY deals.created_at DESC
     LIMIT 20"
);
$deals = $stmt->fetchAll(PDO::FETCH_ASSOC);

?>
<!DOCTYPE html>
<html>
\1
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

    <title>Moderator Dashboard - SpicyBeats</title>
    <link rel="stylesheet" href="admin_styles.css">
    <style>
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
<div style="position: absolute; top: 10px; right: 10px;">
  <a href="logout.php" style="color: red; text-decoration: none; font-weight: bold;">🚪 Logout</a>
</div>

<h1>Moderator Dashboard</h1>

<p>Below is a list of recent deals with reported issues or comments. Moderators can review content and take appropriate action.</p>

<table>
  <thead>
    <tr>
      <th>ID</th>
      <th>Title</th>
      <th>User</th>
      <th>Reports (Fake)</th>
      <th>Comments</th>
      <th>Created At</th>
      <th>Action</th>
    </tr>
  </thead>
  <tbody>
    <?php foreach ($deals as $deal): ?>
      <tr>
        <td><?= htmlspecialchars($deal['id']) ?></td>
        <td><?= htmlspecialchars($deal['title']) ?></td>
        <td><?= htmlspecialchars($deal['username']) ?></td>
        <td><?= (int)$deal['fake_count'] ?></td>
        <td><?= (int)$deal['comment_count'] ?></td>
        <td><?= htmlspecialchars($deal['created_at']) ?></td>
        <td>
          <a href="view_comments.php?deal_id=<?= urlencode($deal['id']) ?>">View Comments</a>
          <?php if ((int)$deal['fake_count'] > 0): ?> |
            <a href="edit.php?id=<?= urlencode($deal['id']) ?>">Edit Deal</a>
          <?php endif; ?>
        </td>
      </tr>
    <?php endforeach; ?>
  </tbody>
</table>

</body>
</html>