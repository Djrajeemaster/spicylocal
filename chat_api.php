<?php
header('Content-Type: application/json');
require_once 'config/db.php';

// Handle fetching of recent messages
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $room = trim($_GET['room'] ?? $_GET['room_name'] ?? '');

    if (!$room) {
        echo json_encode(['success' => false, 'error' => 'Missing room']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT username, message, created_at FROM chat_messages WHERE room_name = ? ORDER BY created_at ASC LIMIT 50");
    $stmt->execute([$room]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'messages' => $messages]);
    exit;
}

// Handle posting of a new message
$data = json_decode(file_get_contents("php://input"), true);

$username = trim($data['username'] ?? '');
$message  = trim($data['message'] ?? '');
$room     = trim($data['room_name'] ?? $data['room'] ?? '');

if (!$username || !$message || !$room) {
    echo json_encode(['success' => false, 'error' => 'Missing data']);
    exit;
}

$stmt = $pdo->prepare("INSERT INTO chat_messages (room_name, username, message, created_at) VALUES (?, ?, ?, NOW())");
$success = $stmt->execute([$room, $username, $message]);

echo json_encode(['success' => $success]);
?>
