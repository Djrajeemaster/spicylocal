<?php
session_start();
if (!isset($_SESSION['admin_logged_in'])) {
    header('Location: login.php');
    exit;
}
require_once __DIR__ . '/../config/db.php';

$deal_id = $_GET['id'] ?? null;

if ($deal_id) {
    // Update deal status to approved
    $stmt = $pdo->prepare("UPDATE deals SET status = 'approved' WHERE id = ?");
    $stmt->execute([$deal_id]);

    // Insert notification for admin
    $admin_id = 1; // Assuming admin user_id is 1
    $message = "Deal with ID $deal_id has been approved.";
    $stmt = $pdo->prepare("INSERT INTO notifications (user_id, message) VALUES (?, ?)");
    $stmt->execute([$admin_id, $message]);

    // Send optional email
    $adminEmail = getenv('ADMIN_EMAIL');
    if ($adminEmail) {
        @mail($adminEmail, 'Deal approved', $message);
    }
}

header('Location: dashboard.php');
exit;
?>
