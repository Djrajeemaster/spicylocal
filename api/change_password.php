
<?php
require_once __DIR__ . '/_security.php';
require_once __DIR__ . '/_bootstrap.php';
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
require_once __DIR__ . '/require_login.php';
session_start();
header('Content-Type: application/json');
require_once 'config/db.php';

if (!isset($_SESSION['username'])) {
  echo json_encode(['success' => false, 'message' => 'Not logged in']);
  exit;
}

$username = $_SESSION['username'];
$data = json_decode(file_get_contents('php://input'), true);

$current = $data['current_password'] ?? '';
$new = $data['new_password'] ?? '';
$confirm = $data['confirm_password'] ?? '';

if (!$current || !$new || !$confirm) {
  echo json_encode(['success' => false, 'message' => 'All fields are required']);
  exit;
}

if ($new !== $confirm) {
  echo json_encode(['success' => false, 'message' => 'New passwords do not match']);
  exit;
}

$stmt = $pdo->prepare("SELECT password FROM users WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch();

if (!$user || !password_verify($current, $user['password'])) {
  echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
  exit;
}

$newHash = password_hash($new, PASSWORD_DEFAULT);
$update = $pdo->prepare("UPDATE users SET password = ? WHERE username = ?");
$update->execute([$newHash, $username]);

echo json_encode(['success' => true, 'message' => 'Password updated successfully']);


// Soft security guards
if (!rate_limit_soft($pdo, 'change_password', 30, 60)) { http_response_code(429); echo json_encode(['ok'=>false,'error'=>'rate_limited']); exit; }
/* CSRF soft-check (not breaking old clients) */ if ($_SERVER['REQUEST_METHOD']==='POST') { check_csrf_soft(); }
