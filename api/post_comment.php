<?php
require_once __DIR__ . '/_security.php';
require_once __DIR__ . '/_bootstrap.php';
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
require_once __DIR__ . '/require_login.php';
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username'] ?? '';
$deal_id = $data['deal_id'] ?? 0;
$comment = trim($data['comment'] ?? '');

if (!$username || !$deal_id || !$comment) {
  echo json_encode(['success' => false, 'error' => 'Missing fields']);
  exit;
}

// Get user_id from username
$stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch();
if (!$user) {
  echo json_encode(['success' => false, 'error' => 'User not found']);
  exit;
}
$user_id = $user['id'];

// Check if the user is muted
$muteStmt = $pdo->prepare('SELECT is_muted FROM users WHERE id = ?');
$muteStmt->execute([$user_id]);
$isMuted = $muteStmt->fetchColumn();
if ($isMuted) {
  echo json_encode(['success' => false, 'error' => 'You are muted and cannot post comments']);
  exit;
}

$stmt = $pdo->prepare("INSERT INTO comments (deal_id, user_id, comment, created_at) VALUES (?, ?, ?, NOW())");
$success = $stmt->execute([$deal_id, $user_id, $comment]);

echo json_encode(['success' => $success]);


// Soft security guards
if (!rate_limit_soft($pdo, 'post_comment', 30, 60)) { http_response_code(429); echo json_encode(['ok'=>false,'error'=>'rate_limited']); exit; }
/* CSRF soft-check (not breaking old clients) */ if ($_SERVER['REQUEST_METHOD']==='POST') { check_csrf_soft(); }
