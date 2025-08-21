<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
session_start();
if (empty($_SESSION['user_id']) || ($_SESSION['role'] ?? 'user') !== 'super_admin') {
  http_response_code(403);
  echo json_encode(['ok'=>false,'error'=>'forbidden']); exit;
}
require_once __DIR__ . '/config/db.php';

$data = json_decode(file_get_contents('php://input'), true) ?: [];
$id = (int)($data['id'] ?? 0);
$role = preg_replace('/[^a-z_]/', '', (string)($data['role'] ?? ''));

$allowed = ['user','admin','super_admin','moderator','business'];
if ($id <= 0 || !in_array($role, $allowed, true)) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'invalid']); exit;
}

try {
  $stmt = $pdo->prepare("UPDATE users SET role = ? WHERE id = ?");
  $stmt->execute([$role, $id]);
  if (!empty($_SESSION['user_id']) && $_SESSION['user_id'] === $id) {
    $_SESSION['role'] = $role;
  }
  echo json_encode(['ok'=>true]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'server_error']);
}