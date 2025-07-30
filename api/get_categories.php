<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

try {
    $stmt = $pdo->query("SELECT DISTINCT name FROM categories ORDER BY name");
    $categories = $stmt->fetchAll();
    echo json_encode($categories);
} catch (Exception $e) {
    echo json_encode(['error' => 'Failed to fetch categories']);
}
?>
