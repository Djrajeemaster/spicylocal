<?php
require_once __DIR__ . '/config/db.php';

$deal_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if (!$deal_id) {
    echo json_encode(['error' => 'Missing deal_id']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE deals SET views = views + 1 WHERE id = ?");
    $stmt->execute([$deal_id]);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
