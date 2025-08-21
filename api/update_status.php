<?php
ini_set('display_errors', 0);
require_once __DIR__ . '/config/auth_check.php';
require_once __DIR__ . '/config/db.php';
header('Content-Type: application/json');
if (session_status() !== PHP_SESSION_ACTIVE) { session_start(); }
if (!isset($_SESSION['role']) || ($_SESSION['role']!=='admin' && $_SESSION['role']!=='super_admin' && $_SESSION['role']!=='moderator')) {
  http_response_code(403); echo json_encode(['ok'=>false,'error'=>'Unauthorized']); exit;
}
$id = (int)($_POST['id'] ?? 0); $status = $_POST['status'] ?? '';
$allowed = ['pending','approved','rejected'];
if (!$id || !in_array($status, $allowed, true)) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Bad params']); exit; }
try {
  $stmt = $pdo->prepare("UPDATE deals SET status = :s WHERE id = :id");
  $stmt->execute([':s'=>$status, ':id'=>$id]);
  echo json_encode(['ok'=>true]);
} catch (Exception $e) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'DB error','detail'=>$e->getMessage()]); }
