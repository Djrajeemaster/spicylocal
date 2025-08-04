<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$dealId = isset($_GET['id']) ? intval($_GET['id']) : 0;
if (!$dealId) {
  echo json_encode(['success' => false, 'error' => 'Missing deal ID']);
  exit;
}

try {
  $stmt = $pdo->prepare("
    SELECT d.id, d.title, d.description, d.category, d.image, d.user_id, d.created_at, d.views, u.username
    FROM deals d
    LEFT JOIN users u ON d.user_id = u.id
    WHERE d.id = ?
  ");
  $stmt->execute([$dealId]);
  $deal = $stmt->fetch(PDO::FETCH_ASSOC);

  if ($deal) {
    if (!$deal['username']) {
      $deal['username'] = 'Anonymous';
    }
    echo json_encode(['success' => true, 'deal' => $deal]);
  } else {
    echo json_encode(['success' => false, 'error' => 'Deal not found']);
  }
} catch (Exception $e) {
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
