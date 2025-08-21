<?php
header('Content-Type: application/json');

// Read JSON from frontend
$data = json_decode(file_get_contents("php://input"), true);

$username = $data['username'] ?? '';
$message = $data['message'] ?? '';
$room = $data['room_name'] ?? '';

// Basic check
if (!$username || !$message || !$room) {
  echo json_encode(['success' => false, 'error' => 'Missing data']);
  exit;
}

// TODO: Insert into database later
// For now, just return success
echo json_encode(['success' => true]);
