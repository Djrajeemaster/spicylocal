<?php
require_once __DIR__ . '/_bootstrap.php';
require_once __DIR__ . '/_security.php';
if (($_SESSION['role'] ?? '') !== 'super_admin' && ($_SESSION['role'] ?? '') !== 'admin') { http_response_code(403); echo json_encode(['ok'=>false]); exit; }
$in = json_decode(file_get_contents('php://input'), true) ?: [];
$id = intval($in['id'] ?? 0);
$action = trim($in['action'] ?? '');
if (!$id) { http_response_code(400); echo json_encode(['ok'=>false]); exit; }
if ($action === 'dismiss') {
  $st = $pdo->prepare("DELETE FROM abuse_reports WHERE id=? LIMIT 1"); $st->execute([$id]);
  echo json_encode(['ok'=>true]); exit;
}
if ($action === 'flag') {
  $pdo->beginTransaction();
  try {
    $deal_id = intval($pdo->query("SELECT deal_id FROM abuse_reports WHERE id={$id}")->fetchColumn());
    $pdo->prepare("UPDATE deals SET status='rejected' WHERE id=? LIMIT 1")->execute([$deal_id]);
    $pdo->prepare("DELETE FROM abuse_reports WHERE id=? LIMIT 1")->execute([$id]);
    $pdo->commit();
    echo json_encode(['ok'=>true]); exit;
  } catch (Throwable $e) { $pdo->rollBack(); http_response_code(500); echo json_encode(['ok'=>false]); exit; }
}
echo json_encode(['ok'=>false]);
