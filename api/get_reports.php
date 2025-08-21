<?php
header('Content-Type: application/json');
require_once __DIR__ . '/config/db.php';
try {
  $ids = [];
  if (!empty($_GET['ids'])) {
    foreach (explode(',', $_GET['ids']) as $id) {
      $id = (int)$id;
      if ($id) $ids[] = $id;
    }
  }
  if ($ids) {
    $in = implode(',', array_fill(0, count($ids), '?'));
    $st = $pdo->prepare("SELECT id,reports,upvotes,downvotes FROM deals WHERE id IN ($in)");
    $st->execute($ids);
  } else {
    $st = $pdo->query("SELECT id,reports,upvotes,downvotes FROM deals ORDER BY id DESC LIMIT 500");
  }
  echo json_encode(['ok' => true, 'counts' => $st->fetchAll(PDO::FETCH_ASSOC)]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Server error', 'detail' => $e->getMessage()]);
}
