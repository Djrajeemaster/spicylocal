<?php
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
require_once __DIR__ . '/require_login.php';
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
// Fetch extended user details including role, verified business and mute status
$stmt = $pdo->prepare("SELECT username, email, created_at, is_verified, role, is_verified_business, is_muted FROM users WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch();

if ($user) {
    echo json_encode([
        'success'            => true,
        'username'           => $user['username'],
        'email'              => $user['email'],
        'created_at'         => $user['created_at'],
        'is_verified'        => $user['is_verified'],
        'role'               => $user['role'],
        'is_verified_business' => $user['is_verified_business'],
        'is_muted'           => $user['is_muted']
    ]);
} else {
    echo json_encode(['success' => false, 'error' => 'User not found']);
}
