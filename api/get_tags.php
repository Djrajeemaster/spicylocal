<?php
// Returns a list of popular tags used across deals
// Accepts optional `limit` parameter to limit number of tags returned
// Response: JSON array of objects with tag_name and count

header('Content-Type: application/json');
require_once __DIR__ . '/config/db.php';

$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
if ($limit <= 0) $limit = 10;

try {
    // Ensure table exists. If not, gracefully return empty array.
    $stmtCheck = $pdo->query("SHOW TABLES LIKE 'deal_tags'");
    if ($stmtCheck->rowCount() === 0) {
        echo json_encode([]);
        exit;
    }
    $stmt = $pdo->prepare("SELECT tag_name, COUNT(*) AS count FROM deal_tags GROUP BY tag_name ORDER BY count DESC LIMIT ?");
    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->execute();
    $tags = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($tags);
} catch (Exception $e) {
    echo json_encode([]);
}
?>