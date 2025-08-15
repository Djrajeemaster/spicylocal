<?php
require_once __DIR__ . '/_bootstrap.php';
require_once __DIR__ . '/_security.php';
if (($_SESSION['role'] ?? '') !== 'super_admin' && ($_SESSION['role'] ?? '') !== 'admin') { http_response_code(403); echo json_encode(['ok'=>false]); exit; }
$in = json_decode(file_get_contents('php://input'), true) ?: [];
$id = intval($in['id'] ?? 0);
$approve = !!($in['approve'] ?? false);
if (!$id) { http_response_code(400); echo json_encode(['ok'=>false]); exit; }
$pdo->beginTransaction();
try{
  $row = $pdo->query("SELECT user_id FROM business_profiles WHERE id={$id}")->fetch(PDO::FETCH_ASSOC);
  if (!$row) { throw new Exception('notfound'); }
  $uid = intval($row['user_id']);
  $pdo->prepare("UPDATE business_profiles SET verified=? WHERE id=?")->execute([$approve?1:0, $id]);
  $pdo->prepare("UPDATE users SET is_verified_business=? WHERE id=?")->execute([$approve?1:0, $uid]);
  $pdo->commit();
  echo json_encode(['ok'=>true]);
}catch(Throwable $e){ $pdo->rollBack(); http_response_code(500); echo json_encode(['ok'=>false]); }
