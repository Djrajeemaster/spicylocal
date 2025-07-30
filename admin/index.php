<?php
session_start();
require_once __DIR__ . '/../config/db.php';

if (!isset($_SESSION['admin_logged_in'])) {
  header('Location: login.php');
  exit;
}

$stmt = $pdo->query("SELECT * FROM deals ORDER BY created_at DESC");
$deals = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html>
<head>
  <title>Admin Dashboard</title>
  <link rel="stylesheet" href="admin.css">
</head>
<body>
  <h2>Welcome, Admin</h2>
  <p><a href="logout.php">Logout</a></p>
  <h3>All Deals</h3>
  <table>
    <tr>
      <th>ID</th><th>Title</th><th>Status</th><th>Actions</th>
    </tr>
    <?php foreach ($deals as $deal): ?>
    <tr>
      <td><?= $deal['id'] ?></td>
      <td><?= htmlspecialchars($deal['title']) ?></td>
      <td><?= $deal['status'] ?></td>
      <td>
        <?php if ($deal['status'] === 'pending'): ?>
          <a href="approve.php?id=<?= $deal['id'] ?>">Approve</a> |
          <a href="reject.php?id=<?= $deal['id'] ?>">Reject</a>
        <?php else: ?>
          <em>No action</em>
        <?php endif; ?>
        | <a href="delete.php?id=<?= $deal['id'] ?>" onclick="return confirm('Delete?')">Delete</a>
      </td>
    </tr>
    <?php endforeach; ?>
  </table>
</body>
</html>
