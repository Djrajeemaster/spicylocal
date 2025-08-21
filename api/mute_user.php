<?php
require_once __DIR__ . '/_security.php';
require_once __DIR__ . '/_bootstrap.php';
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
require_once __DIR__ . '/require_login.php';
// API to mute or unmute a user
// Accepts POST parameters: username, action (mute|unmute)
// Only admins or moderators should be allowed to call this; check session role

header('Content-Type: application/json');
session_start();
require_once '../config/db.php';

// Validate request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request']);
    exit;
}

// Check if user is logged in and has role
$role = $_SESSION['role'] ?? '';
if (!in_array($role, ['admin', 'moderator', 'super_admin'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$action = isset($_POST['action']) ? trim($_POST['action']) : '';

if (!$username || !in_array($action, ['mute','unmute'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid parameters']);
    exit;
}

try {
    // Prevent moderators from muting admins or moderators (admins can mute anyone except super_admin)
    if ($role === 'moderator') {
        $stmt = $pdo->prepare('SELECT role FROM users WHERE username = :username');
        $stmt->execute([':username' => $username]);
        $targetRole = $stmt->fetchColumn();
        if (in_array($targetRole, ['admin','moderator','super_admin'])) {
            echo json_encode(['success' => false, 'error' => 'Cannot mute other admins or moderators']);
            exit;
        }
    }

    $muteFlag = ($action === 'mute') ? 1 : 0;
    $update = $pdo->prepare('UPDATE users SET is_muted = :flag WHERE username = :username');
    $update->execute([':flag' => $muteFlag, ':username' => $username]);
    
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
// Soft security guards
if (!rate_limit_soft($pdo, 'mute_user', 30, 60)) { http_response_code(429); echo json_encode(['ok'=>false,'error'=>'rate_limited']); exit; }
/* CSRF soft-check (not breaking old clients) */ if ($_SERVER['REQUEST_METHOD']==='POST') { check_csrf_soft(); }
