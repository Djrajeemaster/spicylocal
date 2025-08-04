
<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

$stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch();
file_put_contents("login_debug.log", json_encode([
    'input_username' => $username,
    'input_password' => $password,
    'fetched_user' => $user
]));

if ($user && password_verify($password, $user['password'])) {
    echo json_encode(['success' => true, 'user' => $user]);
} else {
    echo json_encode(['error' => 'Invalid credentials']);
}
?>
