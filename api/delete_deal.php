<?php
require_once __DIR__ . '/require_login.php'; // ensures session + user_id
require_once __DIR__ . '/../config/db.php';
header('Content-Type: application/json');

// Admin/super_admin only
if (session_status() !== PHP_SESSION_ACTIVE) { session_start(); }
$role = $_SESSION['role'] ?? null;
if (!in_array($role, ['admin','super_admin'], true)) {
  http_response_code(403);
  echo json_encode(['ok'=>false,'error'=>'Unauthorized']);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok'=>false,'error'=>'Method not allowed']);
  exit;
}

$id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
if ($id <= 0) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'Bad params']);
  exit;
}

try {
  $stmt = $pdo->prepare("DELETE FROM deals WHERE id = ?");
  $stmt->execute([$id]);
  echo json_encode(['ok'=>true]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'DB error','detail'=>$e->getMessage()]);
  exit;
}
