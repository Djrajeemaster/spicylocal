<?php
session_start();
header('Content-Type: text/html; charset=utf-8');
require_once __DIR__ . '/config/db.php';

// Make errors visible while testing (optional)
// ini_set('display_errors', 1);
// error_reporting(E_ALL);

function find_user_by_identifier($pdo, $identifier) {
    $sql  = "SELECT id, email, username FROM users WHERE email = :e OR username = :u LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(array(':e' => $identifier, ':u' => $identifier));
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function ensure_password_resets_table($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(64) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX(token),
        INDEX(user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Location: forgot_password.php');
        exit;
    }

    $identifier = isset($_POST['identifier']) ? trim($_POST['identifier']) : '';
    if ($identifier === '') {
        $_SESSION['reset_msg'] = 'Please enter your email or username.';
        header('Location: forgot_password.php');
        exit;
    }

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    ensure_password_resets_table($pdo);

    $user = find_user_by_identifier($pdo, $identifier);

    // Always reply the same to avoid user enumeration
    $generic_msg = 'If your account exists, a reset link has been generated.';

    if (!$user) {
        echo '<!doctype html><meta charset="utf-8"><style>body{font-family:Arial;padding:24px}</style>';
        echo '<h2>Password reset</h2>';
        echo '<p>' . htmlspecialchars($generic_msg) . '</p>';
        echo '<p><a href="forgot_password.php">Back</a></p>';
        exit;
    }

    // Generate token and expiry (60 minutes)
    $token   = bin2hex(random_bytes(32)); // 64 hex chars
    $expires = date('Y-m-d H:i:s', time() + 60*60);

    // Keep only one active token per user
    $del = $pdo->prepare('DELETE FROM password_resets WHERE user_id = :uid');
    $del->execute(array(':uid' => $user['id']));

    $ins = $pdo->prepare('INSERT INTO password_resets (user_id, token, expires_at) VALUES (:uid, :t, :exp)');
    $ins->execute(array(':uid' => $user['id'], ':t' => $token, ':exp' => $expires));

    // Build reset URL
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
    $base   = $scheme . '://' . $_SERVER['HTTP_HOST'] . rtrim(dirname($_SERVER['REQUEST_URI']), '/\\');
    $reset_url = $base . '/reset_password.php?token=' . urlencode($token);

    // For testing: show link and also log it to file
    $logPath = __DIR__ . '/tmp_reset_links.txt';
    @file_put_contents($logPath, date('c') . " UID=" . $user['id'] . " " . $reset_url . "\n", FILE_APPEND);

    echo '<!doctype html><meta charset="utf-8">';
    echo '<style>body{font-family:Arial;padding:24px} a.btn{display:inline-block;padding:10px 14px;background:#030849;color:#fff;border-radius:6px;text-decoration:none}</style>';
    echo '<h2>Password reset</h2>';
    echo '<p>' . htmlspecialchars($generic_msg) . '</p>';
    echo '<p><b>Testing mode:</b> Here is your reset link (expires in 60 minutes):</p>';
    echo '<p><a class="btn" href="' . htmlspecialchars($reset_url) . '">Reset Password</a></p>';
    echo '<p><small>Link also logged to <code>tmp_reset_links.txt</code>.</small></p>';
    exit;

} catch (Throwable $e) {
    http_response_code(500);
    echo '<!doctype html><meta charset="utf-8"><pre>Error: ' . htmlspecialchars($e->getMessage()) . '</pre>';
}
