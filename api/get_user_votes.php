<?php
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
require_once __DIR__ . '/require_login.php';
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$username = $_GET['username'] ?? '';
if (!$username) {
  echo json_encode(['success' => false, 'error' => 'Missing username']);
  exit;
}

// Step 1: Find user_id from username
$stmtUser = $pdo->prepare("SELECT id FROM users WHERE username = ?");
$stmtUser->execute([$username]);
$user = $stmtUser->fetch();

if (!$user) {
  echo json_encode(['success' => false, 'error' => 'User not found']);
  exit;
}

$userId = $user['id'];

// Step 2: Fetch vote records using user_id
$stmt = $pdo->prepare("SELECT deal_id, vote_type FROM votes WHERE user_id = ?");
$stmt->execute([$userId]);
$votes = $stmt->fetchAll();

echo json_encode(['success' => true, 'votes' => $votes]);
?>
