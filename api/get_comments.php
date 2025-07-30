<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$deal_id = $_GET['deal_id'] ?? null;
if (!$deal_id) {
    echo json_encode([]);
    exit;
}
$stmt = $pdo->prepare('SELECT c.comment, u.username, c.created_at FROM comments c JOIN users u ON c.user_id = u.id WHERE c.deal_id = ? ORDER BY c.created_at DESC');
$stmt->execute([$deal_id]);
$comments = $stmt->fetchAll();
echo json_encode($comments);
