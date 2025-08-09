<?php
// API endpoint to submit abuse reports
// Accepts POST parameters: deal_id, username, reason
// Returns JSON with {success: true} or {success: false, error: '...'}

header('Content-Type: application/json');
session_start();
require_once '../config/db.php';

// Ensure request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

// Retrieve POST variables
// Support JSON payload or form data
if (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    $deal_id = isset($data['deal_id']) ? intval($data['deal_id']) : 0;
    // accept both 'username' and 'reporter' keys for compatibility
    $username = isset($data['username']) ? trim($data['username']) : (isset($data['reporter']) ? trim($data['reporter']) : '');
    $reason = isset($data['reason']) ? trim($data['reason']) : '';
} else {
    $deal_id = isset($_POST['deal_id']) ? intval($_POST['deal_id']) : 0;
    $username = isset($_POST['username']) ? trim($_POST['username']) : (isset($_POST['reporter']) ? trim($_POST['reporter']) : '');
    $reason = isset($_POST['reason']) ? trim($_POST['reason']) : '';
}

if ($deal_id <= 0 || !$username || !$reason) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

try {
    // Check if abuse_reports table exists. If not, we create it.
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS abuse_reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            deal_id INT NOT NULL,
            reported_by VARCHAR(255) NOT NULL,
            reason TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            reviewed TINYINT(1) DEFAULT 0
        )"
    );

    // Prevent duplicate report by same user on same deal
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM abuse_reports WHERE deal_id = :deal_id AND reported_by = :username');
    $stmt->execute([':deal_id' => $deal_id, ':username' => $username]);
    $count = $stmt->fetchColumn();
    if ($count > 0) {
        echo json_encode(['success' => false, 'error' => 'You have already reported this deal']);
        exit;
    }

    // Insert report
    $insert = $pdo->prepare('INSERT INTO abuse_reports (deal_id, reported_by, reason) VALUES (:deal_id, :username, :reason)');
    $insert->execute([
        ':deal_id' => $deal_id,
        ':username' => $username,
        ':reason' => $reason
    ]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}