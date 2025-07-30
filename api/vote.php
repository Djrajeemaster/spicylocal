<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);
$deal_id = $data['deal_id'] ?? null;
$vote = $data['vote_type'] ?? null; // <- CHANGED to match frontend

if (!$deal_id || !in_array($vote, ['up', 'down'])) {
    echo json_encode([
        'error' => 'Invalid vote data',
        'received' => $data
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO votes (deal_id, vote_type) VALUES (?, ?)");
    $stmt->execute([$deal_id, $vote]);

    $countStmt = $pdo->prepare("
        SELECT SUM(CASE WHEN vote_type = 'up' THEN 1
                        WHEN vote_type = 'down' THEN -1
                        ELSE 0 END) AS total_votes
        FROM votes WHERE deal_id = ?
    ");
    $countStmt->execute([$deal_id]);
    $total = $countStmt->fetch()['total_votes'] ?? 0;

    echo json_encode(['success' => true, 'total_votes' => (int)$total]);
} catch (Exception $e) {
    echo json_encode(['error' => 'Vote failed', 'details' => $e->getMessage()]);
}
?>
