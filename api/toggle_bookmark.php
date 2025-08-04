<?php
session_start();
header('Content-Type: application/json');
require_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);
$username = $data['username'] ?? '';
$deal_id = $data['deal_id'] ?? '';

if (!$username || !$deal_id) {
  echo json_encode(['success' => false, 'error' => 'Missing data']);
  exit;
}

// Check if already bookmarked
$check = $pdo->prepare("SELECT id FROM bookmarks WHERE username = ? AND deal_id = ?");
$check->execute([$username, $deal_id]);

if ($check->fetch()) {
  // Remove it
  $del = $pdo->prepare("DELETE FROM bookmarks WHERE username = ? AND deal_id = ?");
  $del->execute([$username, $deal_id]);
  echo json_encode(['success' => true, 'action' => 'removed']);
} else {
  // Add it
  $insert = $pdo->prepare("INSERT INTO bookmarks (username, deal_id, created_at) VALUES (?, ?, NOW())");
  $insert->execute([$username, $deal_id]);
  echo json_encode(['success' => true, 'action' => 'added']);
}
