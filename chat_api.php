<?php
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

$username = trim($data['username'] ?? '');
$message  = trim($data['message'] ?? '');
$room     = trim($data['room'] ?? '');

if (!$username || !$message || !$room) {
    echo json_encode(['success' => false, 'error' => 'Missing data']);
    exit;
}

require_once 'config/db.php';

$stmt = $pdo->prepare("INSERT INTO chat_messages (room_name, username, message, created_at) VALUES (?, ?, ?, NOW())");
$success = $stmt->execute([$room, $username, $message]);

echo json_encode(['success' => $success]);
?>
