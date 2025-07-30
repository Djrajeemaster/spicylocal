<?php
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Login required']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$deal_id = $data['deal_id'] ?? null;
$comment = trim($data['comment'] ?? '');
$user_id = $_SESSION['user_id'];

if (!$deal_id || !$comment) {
    echo json_encode(['error' => 'Missing fields']);
    exit;
}

$stmt = $pdo->prepare('INSERT INTO comments (deal_id, user_id, comment) VALUES (?, ?, ?)');
$stmt->execute([$deal_id, $user_id, $comment]);

echo json_encode(['success' => true]);
