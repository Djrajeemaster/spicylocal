<?php
session_start();
header('Content-Type: application/json');
require_once 'config/db.php';

$username = $_GET['username'] ?? '';

if (!$username) {
    echo json_encode(['success' => false, 'error' => 'Username missing']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT d.id, d.title, d.description, d.category, d.image, d.status, d.created_at, d.views, d.is_pinned
        FROM bookmarks b
        JOIN deals d ON b.deal_id = d.id
        WHERE b.username = ?
        ORDER BY b.id DESC
        LIMIT 20
    ");
    $stmt->execute([$username]);
    $deals = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'deals' => $deals]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'deals' => [], 'error' => $e->getMessage()]);
}
