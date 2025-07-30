<?php
session_start();
if (!isset($_SESSION['admin_logged_in'])) {
    header('Location: login.php');
    exit;
}
require_once __DIR__ . '/../config/db.php';
$users = $pdo->query('SELECT id, username, role FROM users ORDER BY created_at DESC')->fetchAll();
?>
<!DOCTYPE html>
<html>
<head><title>User Management</title></head>
<body>
<h2>Users</h2>
<table border="1" cellpadding="5">
<tr><th>ID</th><th>Username</th><th>Role</th></tr>
<?php foreach ($users as $u): ?>
<tr><td><?= $u['id'] ?></td><td><?= htmlspecialchars($u['username']) ?></td><td><?= $u['role'] ?></td></tr>
<?php endforeach; ?>
</table>
<p><a href="dashboard.php">Back</a></p>
</body>
</html>
