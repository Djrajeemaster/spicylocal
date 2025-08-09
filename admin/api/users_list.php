
<?php
require_once __DIR__ . '/../config/auth_check.php';
require_once __DIR__ . '/../config/db.php';
header('Content-Type: application/json');

try {
  $stmt = $pdo->query("SELECT id, username, role, IFNULL(is_verified_business,0) AS is_verified_business, IFNULL(is_muted,0) AS is_muted FROM users ORDER BY username");
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
  echo json_encode($rows);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => 'DB error']);
}
