<?php
// Delete a deal from the database. Only accessible to admin or super admin.
require_once __DIR__ . '/config/auth_check.php';
require_once __DIR__ . '/config/db.php';

$id = $_GET['id'] ?? 0;
if (!$id) {
    // Invalid id; optionally display an error message or log
    header('Location: dashboard.php');
    exit;
}

// Perform the delete operation
$stmt = $pdo->prepare('DELETE FROM deals WHERE id = ?');
$stmt->execute([$id]);

header('Location: dashboard.php');
exit;
?>