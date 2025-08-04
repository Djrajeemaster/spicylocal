<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);
$deal_id = $data['deal_id'] ?? null;
$feedback = $data['feedback'] ?? null;
$username = $data['username'] ?? null;

if (!$deal_id || !$feedback || !$username) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

$validTypes = ['useful', 'not_interested', 'fake'];
if (!in_array($feedback, $validTypes)) {
    echo json_encode(['success' => false, 'error' => 'Invalid feedback type']);
    exit;
}

try {
    // Delete old feedback from same user for this deal
    $del = $pdo->prepare("DELETE FROM feedback WHERE deal_id = ? AND username = ?");
    $del->execute([$deal_id, $username]);

    // Insert new feedback
    $ins = $pdo->prepare("INSERT INTO feedback (deal_id, username, feedback_type) VALUES (?, ?, ?)");
    $ins->execute([$deal_id, $username, $feedback]);

    // Return counts
    $counts = [];
    foreach ($validTypes as $type) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM feedback WHERE deal_id = ? AND feedback_type = ?");
        $stmt->execute([$deal_id, $type]);
        $counts[$type] = $stmt->fetchColumn();
    }

    echo json_encode(['success' => true, 'counts' => $counts]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
