<?php
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
require_once __DIR__ . '/require_login.php';
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$username = $_GET['username'] ?? '';
if (!$username) {
  echo json_encode(['success' => false, 'error' => 'Missing username']);
  exit;
}

$stmt = $pdo->prepare("SELECT deal_id, feedback_type FROM feedback WHERE username = ?");
$stmt->execute([$username]);
$feedback = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['success' => true, 'feedback' => $feedback]);
?>