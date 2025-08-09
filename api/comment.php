
<?php
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
require_once __DIR__ . '/require_login.php';
header('Content-Type: application/json');
require_once __DIR__ . '/config/db.php';

$data = json_decode(file_get_contents('php://input'), true);
$deal_id = $data['deal_id'] ?? null;
$user_id = $data['user_id'] ?? null;
$comment = trim($data['comment'] ?? '');

if (!$deal_id || !$user_id || !$comment) {
    echo json_encode(['error' => 'Missing comment data']);
    exit;
}

$stmt = $pdo->prepare("INSERT INTO comments (deal_id, user_id, comment) VALUES (?, ?, ?)");
$stmt->execute([$deal_id, $user_id, $comment]);

echo json_encode(['success' => true, 'message' => 'Comment added']);
?>
