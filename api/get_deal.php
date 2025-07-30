<?php
require_once '../config/db.php';

// Expire outdated deals
$pdo->exec("UPDATE deals SET status = 'expired' WHERE expiry_timestamp IS NOT NULL AND expiry_timestamp <= NOW() AND status != 'expired'");
header('Content-Type: application/json');

$id = $_GET['id'] ?? null;

if (!$id) {
  echo json_encode(['error' => 'Missing ID']);
  exit;
}

try {
  $stmt = $pdo->prepare("
    SELECT d.*,
      (SELECT SUM(CASE WHEN vote_type = 'up' THEN 1 WHEN vote_type = 'down' THEN -1 ELSE 0 END)
       FROM votes WHERE deal_id = d.id) AS votes,
      (SELECT AVG(rating) FROM ratings WHERE deal_id = d.id) AS avg_rating
    FROM deals d
    WHERE d.id = ?
    LIMIT 1
  ");
  $stmt->execute([$id]);
  $deal = $stmt->fetch(PDO::FETCH_ASSOC);

  echo json_encode($deal ?: ['error' => 'Deal not found']);
} catch (Exception $e) {
  echo json_encode(['error' => 'Failed to load deal']);
}
