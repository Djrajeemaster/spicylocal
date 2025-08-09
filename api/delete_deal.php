<?php
require_once __DIR__ . '/config/auth_check.php';
require_once __DIR__ . '/config/db.php';
header('Content-Type: application/json');
session_start();
if (!isset($_SESSION['role']) || ($_SESSION['role']!=='admin' && $_SESSION['role']!=='super_admin')) {
  http_response_code(403); echo json_encode(['ok'=>false,'error'=>'Unauthorized']); exit;
}
$id = (int)($_POST['id'] ?? 0);
if (!$id) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Bad params']); exit; }
try {
  $stmt = $pdo->prepare("DELETE FROM deals WHERE id = :id");
  $stmt->execute([':id'=>$id]);
  echo json_encode(['ok'=>true]);
} catch (Exception $e) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'DB error','detail'=>$e->getMessage()]); }
