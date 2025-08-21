<?php
require_once __DIR__ . '/_security.php';
require_once __DIR__ . '/_bootstrap.php';
require_once __DIR__ . '/../admin/config/auth_check.php';
require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json');

// Role gate (mods cannot pin)
$role = $_SESSION['role'] ?? 'user';
if (!in_array($role, ['admin','super_admin'], true)) {
  http_response_code(403);
  echo json_encode(['ok'=>false,'error'=>'Unauthorized']);
  exit;
}

// POST only
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok'=>false,'error'=>'Method Not Allowed']);
  exit;
}

$id = (int)($_POST['id'] ?? 0);
if ($id <= 0) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'Bad params']);
  exit;
}

try {
  // Enforce: only approved deals can be pinned/unpinned
  $pdo->beginTransaction();

  // Lock the row to avoid race conditions
  $stmt = $pdo->prepare("SELECT id, is_pinned, status FROM deals WHERE id = :id FOR UPDATE");
  $stmt->execute([':id'=>$id]);
  $deal = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$deal) {
    $pdo->rollBack();
    http_response_code(404);
    echo json_encode(['ok'=>false,'error'=>'Deal not found']);
    exit;
  }

  if ($deal['status'] !== 'approved') {
    $pdo->rollBack();
    http_response_code(409);
    echo json_encode(['ok'=>false,'error'=>'Only approved deals can be pinned']);
    exit;
  }

  $newPinned = (int)(1 - (int)$deal['is_pinned']);

  $upd = $pdo->prepare("UPDATE deals SET is_pinned = :pinned WHERE id = :id");
  $upd->execute([':pinned'=>$newPinned, ':id'=>$id]);

  $pdo->commit();

  echo json_encode(['ok'=>true,'pinned'=>$newPinned]);
  exit;

} catch (Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'DB error']);
  exit;
}

// Soft security guards
if (!rate_limit_soft($pdo, 'pin_toggle', 30, 60)) { http_response_code(429); echo json_encode(['ok'=>false,'error'=>'rate_limited']); exit; }
/* CSRF soft-check (not breaking old clients) */ if ($_SERVER['REQUEST_METHOD']==='POST') { check_csrf_soft(); }
