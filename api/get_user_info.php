<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

// ✅ Check session login
if (!isset($_SESSION['username'])) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

$username = $_SESSION['username'];

// ✅ Fetch user details
$stmt = $pdo->prepare("SELECT username, email, created_at, is_verified FROM users WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch();

if ($user) {
    echo json_encode([
        'success' => true,
        'username' => $user['username'],
        'email' => $user['email'],
        'created_at' => $user['created_at'],
        'is_verified' => $user['is_verified']
    ]);
} else {
    echo json_encode(['success' => false, 'error' => 'User not found']);
}
