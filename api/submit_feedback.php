<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);
$deal_id = $data['deal_id'] ?? null;
$username = $data['username'] ?? '';
$feedback = $data['feedback'] ?? '';

if (!$deal_id || !$username || !in_array($feedback, ['useful', 'not_interested', 'fake'])) {
  echo json_encode(['success' => false, 'error' => 'Invalid input']);
  exit;
}

$stmt = $pdo->prepare("INSERT INTO feedback (deal_id, username, feedback_type) VALUES (?, ?, ?)");
$stmt->execute([$deal_id, $username, $feedback]);

echo json_encode(['success' => true, 'message' => 'Feedback recorded']);
?>
