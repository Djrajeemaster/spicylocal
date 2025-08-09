<?php
// /bagit/api/auth/login.php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

require_once __DIR__ . '/../config/db.php';
session_start();

try {
  $data = json_decode(file_get_contents('php://input'), true) ?: [];
  $username = trim($data['username'] ?? '');
  $password = (string)($data['password'] ?? '');

  if ($username === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'missing_fields']); exit;
  }

  $stmt = $pdo->prepare("SELECT id, username, password AS passhash, role, is_verified_business FROM users WHERE username = ? LIMIT 1");
  $stmt->execute([$username]);
  $user = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$user) {
    http_response_code(401);
    echo json_encode(['ok'=>false,'error'=>'invalid_credentials']); exit;
  }

  $hash = (string)$user['passhash'];
  $valid = false;
  if (preg_match('/^\$2[ayb]\$/', $hash)) {
    $valid = password_verify($password, $hash);
  } else {
    $valid = hash_equals($hash, $password);
  }

  if (!$valid) {
    http_response_code(401);
    echo json_encode(['ok'=>false,'error'=>'invalid_credentials']); exit;
  }

  session_regenerate_id(true);
  $_SESSION['user_id'] = (int)$user['id'];
  $_SESSION['username'] = $user['username'];
  $_SESSION['role'] = $user['role'] ?: 'user';
  $_SESSION['is_verified_business'] = (int)($user['is_verified_business'] ?? 0);

  echo json_encode([
    'ok' => true,
    'user' => [
      'id' => (int)$user['id'],
      'username' => $user['username'],
      'role' => $_SESSION['role'],
      'is_verified_business' => (int)$_SESSION['is_verified_business']
    ]
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'server_error']);
}
