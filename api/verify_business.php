<?php
require_once __DIR__ . '/config/auth_check.php';
require_once __DIR__ . '/config/db.php';
header('Content-Type: application/json');
session_start();
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'super_admin') {
  http_response_code(403); echo json_encode(['ok'=>false,'error'=>'Unauthorized']); exit;
}
$input = json_decode(file_get_contents('php://input'), true);
$username = $input['username'] ?? ''; $val = isset($input['is_verified_business']) ? (int)$input['is_verified_business'] : 0;
if (!$username) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Bad params']); exit; }
try {
  $stmt = $pdo->prepare("UPDATE users SET is_verified_business = :v WHERE username = :u");
  $stmt->execute([':v'=>$val, ':u'=>$username]);
  echo json_encode(['ok'=>true]);
} catch (Exception $e) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'DB error','detail'=>$e->getMessage()]); }
