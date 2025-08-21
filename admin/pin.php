<?php
require_once 'config/auth_check.php';
require_once 'config/db.php';

$deal_id = $_GET['id'] ?? 0;

$stmt = $pdo->prepare("SELECT is_pinned FROM deals WHERE id = ?");
$stmt->execute([$deal_id]);
$deal = $stmt->fetch();

if ($deal) {
  $new_pin_state = $deal['is_pinned'] ? 0 : 1;
  $update = $pdo->prepare("UPDATE deals SET is_pinned = ? WHERE id = ?");
  $update->execute([$new_pin_state, $deal_id]);
}

header('Location: /bagit/admin/dashboard.php');
exit;
