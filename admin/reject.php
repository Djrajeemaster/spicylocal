<?php
session_start();
if (!isset($_SESSION['admin_logged_in'])) {
    header('Location: login.php');
    exit;
}
require_once __DIR__ . '/../config/db.php';

$deal_id = $_GET['id'] ?? null;

if ($deal_id) {
    // Check if the deal exists
    $stmt = $pdo->prepare("SELECT * FROM deals WHERE id = ?");
    $stmt->execute([$deal_id]);
    $deal = $stmt->fetch();

    if ($deal) {
        // Update deal status to 'rejected'
        $stmt = $pdo->prepare("UPDATE deals SET status = 'rejected' WHERE id = ?");
        $stmt->execute([$deal_id]);

        // Optionally set a session flash message for success
        $_SESSION['message'] = 'Deal rejected successfully.';
    } else {
        // Optionally set a session flash message for failure
        $_SESSION['message'] = 'Deal not found.';
    }
}

header('Location: dashboard.php');
exit;
?>
