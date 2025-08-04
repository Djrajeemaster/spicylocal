<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$dealId = $_GET['id'] ?? '';
if (!$dealId) {
  echo json_encode(['success' => false, 'error' => 'Missing deal ID']);
  exit;
}

$stmt = $pdo->prepare("
  SELECT c.comment, u.username, c.created_at
  FROM comments c
  JOIN users u ON c.user_id = u.id
  WHERE c.deal_id = ?
  ORDER BY c.created_at ASC
");
$stmt->execute([$dealId]);
$comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['success' => true, 'comments' => $comments]);
?>
