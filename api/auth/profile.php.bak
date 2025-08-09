
<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$user_id = $_GET['user_id'] ?? 0;
$stmt = $pdo->prepare("SELECT id, username, email FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();

echo json_encode($user);
?>
