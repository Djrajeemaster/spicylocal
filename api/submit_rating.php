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
$rating = (int)($data['rating'] ?? 0);
$user_id = $_SESSION['user_id'];

if (!$deal_id || $rating < 1 || $rating > 5) {
    echo json_encode(['error' => 'Invalid data']);
    exit;
}

// Upsert rating
$stmt = $pdo->prepare('SELECT id FROM ratings WHERE deal_id = ? AND user_id = ?');
$stmt->execute([$deal_id, $user_id]);
if ($stmt->fetch()) {
    $upd = $pdo->prepare('UPDATE ratings SET rating = ? WHERE deal_id = ? AND user_id = ?');
    $upd->execute([$rating, $deal_id, $user_id]);
} else {
    $ins = $pdo->prepare('INSERT INTO ratings (deal_id, user_id, rating) VALUES (?, ?, ?)');
    $ins->execute([$deal_id, $user_id, $rating]);
}

echo json_encode(['success' => true]);
