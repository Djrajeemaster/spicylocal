<?php
// Endpoint to retrieve audit logs for super admins
// Returns recent logs in descending order of timestamp

header('Content-Type: application/json');
require_once __DIR__ . '/config/db.php';
session_start();

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'super_admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

// Ensure table exists
$pdo->exec("CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(255),
  admin_user VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details TEXT
)");

try {
    $stmt = $pdo->query("SELECT id, action, admin_user, timestamp, details FROM audit_logs ORDER BY timestamp DESC LIMIT 100");
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($logs);
} catch (Exception $e) {
    echo json_encode([]);
}
?>