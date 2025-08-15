<?php
// /bagit/api/config/auth_check.php
// JSON-friendly session guard for admin/mod actions used by API endpoints.
if (session_status() === PHP_SESSION_NONE) { session_start(); }

$role = isset($_SESSION['role']) ? $_SESSION['role'] : null;
if (!in_array($role, ['admin','super_admin','moderator'], true)) {
  http_response_code(403);
  header('Content-Type: application/json');
  echo json_encode(['ok'=>false,'error'=>'Unauthorized']);
  exit;
}
