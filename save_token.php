<?php
session_start();
require_once 'config/db.php';
$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username'] ?? '';
$token = $data['token'] ?? '';

if ($username && $token) {
    $stmt = $pdo->prepare("UPDATE users SET fcm_token = ? WHERE username = ?");
    $stmt->execute([$token, $username]);
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid data']);
}
?>
