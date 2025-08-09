
<?php
// Approve a pending deal. Only accessible to admin and super admin users.
require_once __DIR__ . '/config/auth_check.php';
require_once __DIR__ . '/config/db.php';

$id = $_GET['id'] ?? 0;
if ($id) {
    $stmt = $pdo->prepare("UPDATE deals SET status = 'approved' WHERE id = ?");
    $stmt->execute([$id]);
}
// Redirect back to the dashboard, preserving the pending filter for convenience
header('Location: dashboard.php?status=pending');
exit;
?>
