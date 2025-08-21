<?php
// api/config/auth_check_api.php — JSON-friendly admin/session guard
// Use this in APIs instead of admin/config/auth_check.php to avoid redirects.

if (session_status() === PHP_SESSION_NONE) { session_start(); }

// Common session fields in your project
$role = isset($_SESSION['role']) ? $_SESSION['role'] : null;
$currentUserId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 0;

// Guard: require admin/super_admin for admin APIs
if (!in_array($role, ['admin','super_admin'], true)) {
  http_response_code(403);
  header('Content-Type: application/json');
  echo json_encode(['ok'=>false, 'error'=>'Unauthorized']);
  exit;
}
