<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Include database connection
require_once __DIR__ . '/config/db.php';

// Test Deal Submission
function testDealSubmission($deal_title, $deal_description, $deal_category, $user_id) {
    global $pdo;  // Use the global $pdo variable
    $stmt = $pdo->prepare("INSERT INTO deals (title, description, category, user_id, status) VALUES (?, ?, ?, ?, 'pending')");
    $stmt->execute([$deal_title, $deal_description, $deal_category, $user_id]);
    echo "Deal Submitted: $deal_title<br>";
}

// Test Deal Approval
function testDealApproval($deal_id) {
    global $pdo;  // Use the global $pdo variable
    $stmt = $pdo->prepare("UPDATE deals SET status = 'approved' WHERE id = ?");
    $stmt->execute([$deal_id]);
    echo "Deal Approved: $deal_id<br>";
}

// Test Deal Rejection
function testDealRejection($deal_id) {
    global $pdo;  // Use the global $pdo variable
    $stmt = $pdo->prepare("UPDATE deals SET status = 'rejected' WHERE id = ?");
    $stmt->execute([$deal_id]);
    echo "Deal Rejected: $deal_id<br>";
}

// Test Deal Deletion
function testDealDeletion($deal_id) {
    global $pdo;  // Use the global $pdo variable
    $stmt = $pdo->prepare("DELETE FROM deals WHERE id = ?");
    $stmt->execute([$deal_id]);
    echo "Deal Deleted: $deal_id<br>";
}

// Run Tests
echo "Running Tests...<br>";

testDealSubmission('Test Deal 1', 'This is a test deal description', 'food', 1);
testDealApproval(1);
testDealRejection(2);
testDealDeletion(3);

echo "Tests Completed.";
?>
