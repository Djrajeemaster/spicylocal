<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'User not logged in']);
    exit;
}

require_once __DIR__ . '/../config/db.php';

$user_id = $_SESSION['user_id']; // User ID from session
$name = $_POST['name'] ?? '';
$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

// Only update password if provided
if (empty($name) || empty($email)) {
    echo json_encode(['error' => 'Name and email are required']);
    exit;
}

try {
    // Check if email already exists (excluding the current user)
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
    $stmt->execute([$email, $user_id]);
    if ($stmt->rowCount() > 0) {
        echo json_encode(['error' => 'Email already exists']);
        exit;
    }

    // Prepare the update query
    $updateQuery = "UPDATE users SET name = ?, email = ?";

    // If password is provided, hash and update it
    if (!empty($password)) {
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $updateQuery .= ", password = ?";
        $stmt = $pdo->prepare($updateQuery . " WHERE id = ?");
        $stmt->execute([$name, $email, $passwordHash, $user_id]);
    } else {
        $stmt = $pdo->prepare($updateQuery . " WHERE id = ?");
        $stmt->execute([$name, $email, $user_id]);
    }

    echo json_encode(['success' => 'Profile updated successfully']);
} catch (Exception $e) {
    echo json_encode(['error' => 'An error occurred', 'details' => $e->getMessage()]);
}
