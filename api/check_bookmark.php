<?php
session_start();
header('Content-Type: application/json');
require_once '../config/db.php';

$username = $_GET['username'] ?? '';
$deal_id = $_GET['deal_id'] ?? '';

if (!$username || !$deal_id) {
  echo json_encode(['success' => false, 'error' => 'Missing parameters']);
  exit;
}

$stmt = $pdo->prepare("SELECT id FROM bookmarks WHERE username = ? AND deal_id = ?");
$stmt->execute([$username, $deal_id]);
$exists = $stmt->fetch();

echo json_encode(['success' => true, 'bookmarked' => !!$exists]);
