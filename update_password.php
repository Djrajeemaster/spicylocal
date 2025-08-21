<?php
session_start();
require_once __DIR__ . '/config/db.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Location: login.php');
        exit;
    }

    $token   = $_POST['token'] ?? '';
    $pass    = $_POST['password'] ?? '';
    $confirm = $_POST['confirm_password'] ?? '';

    if ($token === '' || $pass === '' || $confirm === '') {
        throw new Exception('All fields are required.');
    }
    if ($pass !== $confirm) {
        throw new Exception('Passwords do not match.');
    }
    if (strlen($pass) < 6) {
        throw new Exception('Password must be at least 6 characters.');
    }

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Ensure table exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(64) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX(token),
        INDEX(user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Lookup token
    $stmt = $pdo->prepare('SELECT user_id, expires_at FROM password_resets WHERE token = :t LIMIT 1');
    $stmt->execute([':t' => $token]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        throw new Exception('Invalid or expired token.');
    }

    // Check expiry
    if (new DateTime() > new DateTime($row['expires_at'])) {
        // Cleanup
        $pdo->prepare('DELETE FROM password_resets WHERE token = :t')->execute([':t' => $token]);
        throw new Exception('Reset link has expired. Please request a new one.');
    }

    // Update user's password
    $hash = password_hash($pass, PASSWORD_DEFAULT);
    $up = $pdo->prepare('UPDATE users SET password = :p WHERE id = :uid');
    $up->execute([':p' => $hash, ':uid' => $row['user_id']]);

    // Invalidate token
    $pdo->prepare('DELETE FROM password_resets WHERE token = :t')->execute([':t' => $token]);

    // Redirect to login with message
    $_SESSION['flash'] = 'Password updated. Please log in.';
    header('Location: login.php');
    exit;

} catch (Throwable $e) {
    http_response_code(400);
    echo '<!doctype html><meta charset="utf-8"><style>body{font-family:Arial;padding:24px}</style>';
    echo '<h3>Reset Error</h3>';
    echo '<p>' . htmlspecialchars($e->getMessage()) . '</p>';
    echo '<p><a href="forgot_password.php">Try again</a></p>';
}
