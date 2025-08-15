<?php
// api/config/auth_check_user.php — JSON-friendly guard for signed-in *users* (not admins only)
if (session_status() === PHP_SESSION_NONE) { session_start(); }

header('Content-Type: application/json');

$currentUserId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 0;
if ($currentUserId <= 0) {
  http_response_code(401);
  echo json_encode(['ok'=>false, 'error'=>'Unauthorized', 'code'=>'not_logged_in']);
  exit;
}
