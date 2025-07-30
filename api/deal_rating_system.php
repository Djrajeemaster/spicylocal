<?php
session_start();
require_once __DIR__ . '/../config/db.php';

// Read the raw POST data (JSON)
$data = json_decode(file_get_contents('php://input'), true);

// Check if the required fields are present
$deal_id = $data['deal_id'] ?? null;
$vote = $data['vote'] ?? null;
$user_id = $_SESSION['user_id'] ?? null;  // Ensure the user is logged in

if (!$deal_id || !in_array($vote, ['up', 'down']) || !$user_id) {
    echo json_encode(['error' => 'Invalid input. Ensure deal_id, vote, and user_id are provided.']);
    exit;
}

try {
    // Check if the user has already voted
    $stmt = $pdo->prepare("SELECT * FROM ratings WHERE user_id = ? AND deal_id = ?");
    $stmt->execute([$user_id, $deal_id]);
    $existingVote = $stmt->fetch();

    if ($existingVote) {
        // Update the vote if the user has already voted
        $stmt = $pdo->prepare("UPDATE ratings SET vote = ? WHERE user_id = ? AND deal_id = ?");
        $stmt->execute([$vote, $user_id, $deal_id]);
    } else {
        // Insert new vote if the user hasn't voted yet
        $stmt = $pdo->prepare("INSERT INTO ratings (user_id, deal_id, vote) VALUES (?, ?, ?)");
        $stmt->execute([$user_id, $deal_id, $vote]);
    }

    // Calculate the new vote count for the deal
    $stmt = $pdo->prepare("SELECT vote, COUNT(*) AS total FROM ratings WHERE deal_id = ? GROUP BY vote");
    $stmt->execute([$deal_id]);
    $voteCounts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $upvotes = 0;
    $downvotes = 0;

    foreach ($voteCounts as $voteCount) {
        if ($voteCount['vote'] === 'up') {
            $upvotes = $voteCount['total'];
        } else {
            $downvotes = $voteCount['total'];
        }
    }

    echo json_encode(['upvotes' => $upvotes, 'downvotes' => $downvotes]);
} catch (Exception $e) {
    echo json_encode(['error' => 'An error occurred: ' . $e->getMessage()]);
}
?>