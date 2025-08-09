
<?php
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
require_once __DIR__ . '/require_login.php';
header('Content-Type: application/json');
require_once __DIR__ . '/config/db.php';

$data = json_decode(file_get_contents('php://input'), true);
$deal_id = $data['deal_id'] ?? null;
$user_id = $data['user_id'] ?? null;
$rating = $data['rating'] ?? null;

if (!$deal_id || !$user_id || !$rating || $rating < 1 || $rating > 5) {
    echo json_encode(['error' => 'Invalid rating data']);
    exit;
}

$stmt = $pdo->prepare("REPLACE INTO ratings (deal_id, user_id, rating) VALUES (?, ?, ?)");
$stmt->execute([$deal_id, $user_id, $rating]);

$avgStmt = $pdo->prepare("SELECT ROUND(AVG(rating),1) AS average_rating FROM ratings WHERE deal_id = ?");
$avgStmt->execute([$deal_id]);
$avg = $avgStmt->fetchColumn();

echo json_encode(['success' => true, 'average_rating' => $avg]);
?>
