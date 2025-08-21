<?php
// /bagit/api/auth/profile.php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
session_start();

// Compatibility shim for legacy keys
if (empty($_SESSION['user_id']) && !empty($_SESSION['id'])) {
  $_SESSION['user_id'] = (int)$_SESSION['id'];
}
if (empty($_SESSION['username']) && !empty($_SESSION['user'])) {
  $_SESSION['username'] = (string)$_SESSION['user'];
}
if (empty($_SESSION['role'])) {
  if (!empty($_SESSION['super_admin'])) $_SESSION['role'] = 'super_admin';
  else if (!empty($_SESSION['admin']))   $_SESSION['role'] = 'admin';
  else if (!empty($_SESSION['moderator'])) $_SESSION['role'] = 'moderator';
  else $_SESSION['role'] = 'user';
}
if (!isset($_SESSION['is_verified_business']) && isset($_SESSION['verified_business'])) {
  $_SESSION['is_verified_business'] = (int)$_SESSION['verified_business'];
}

if (empty($_SESSION['user_id'])) {
  http_response_code(401);
  echo json_encode(['error'=>'auth_required']); exit;
}

$user = [
  'id' => (int)$_SESSION['user_id'],
  'username' => (string)($_SESSION['username'] ?? ''),
  'role' => (string)($_SESSION['role'] ?? 'user'),
  'is_verified_business' => (int)($_SESSION['is_verified_business'] ?? 0),
  'ok' => true
];

echo json_encode($user);
