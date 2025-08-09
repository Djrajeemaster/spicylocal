
<?php
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
require_once __DIR__ . '/require_login.php';
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);
$user_id = $data['user_id'] ?? null;
$username = $data['username'] ?? '';
$email = $data['email'] ?? '';

$stmt = $pdo->prepare("UPDATE users SET username = ?, email = ? WHERE id = ?");
$stmt->execute([$username, $email, $user_id]);

echo json_encode(['success' => true]);
?>
