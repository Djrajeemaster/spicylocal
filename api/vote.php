<?php
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
require_once __DIR__ . '/require_login.php';
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);
$dealId = $data['deal_id'] ?? null;
$vote = $data['vote'] ?? null;
$userId = $data['user_id'] ?? null; // ✅ Extract user_id safely

if (!$dealId || !in_array($vote, ['up', 'down'])) {
    echo json_encode(['error' => 'Invalid vote data']);
    exit;
}

try {
    // Optional: delete old vote if you want to allow only 1 vote per deal per user
    if ($userId) {
        $pdo->prepare("DELETE FROM votes WHERE deal_id = ? AND user_id = ?")->execute([$dealId, $userId]);
    } else {
        $pdo->prepare("DELETE FROM votes WHERE deal_id = ?")->execute([$dealId]);
    }

    // ✅ Use the correct INSERT query depending on user_id presence
    if ($userId) {
        $stmt = $pdo->prepare("INSERT INTO votes (deal_id, vote_type, user_id) VALUES (?, ?, ?)");
        $stmt->execute([$dealId, $vote, $userId]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO votes (deal_id, vote_type) VALUES (?, ?)");
        $stmt->execute([$dealId, $vote]);
    }

    // Count total votes
    $countStmt = $pdo->prepare("SELECT 
        SUM(vote_type = 'up') AS up,
        SUM(vote_type = 'down') AS down 
        FROM votes WHERE deal_id = ?");
    $countStmt->execute([$dealId]);
    $votes = $countStmt->fetch();

    $total = $votes['up'] - $votes['down'];

    echo json_encode(['success' => true, 'total_votes' => $total]);
} catch (Exception $e) {
    echo json_encode(['error' => 'Vote failed', 'details' => $e->getMessage()]);
}
