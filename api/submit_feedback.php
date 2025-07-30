
<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

// Example API endpoint to submit feedback for deals
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $deal_id = $data['deal_id'] ?? null;
    $user_id = $data['user_id'] ?? null;
    $feedback_type = $data['feedback_type'] ?? null;

    if (!$deal_id || !$user_id || !$feedback_type) {
        echo json_encode(['error' => 'Missing required fields']);
        exit;
    }

    // Insert feedback into the database
    $stmt = $pdo->prepare("INSERT INTO deal_feedback (deal_id, user_id, feedback_type) VALUES (?, ?, ?)");
    $stmt->execute([$deal_id, $user_id, $feedback_type]);

    echo json_encode(['success' => true, 'message' => 'Feedback submitted successfully']);
}
?>
