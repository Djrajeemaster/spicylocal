<?php
session_start();
require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    $stmt = $pdo->prepare('SELECT password FROM admins WHERE username = ?');
    $stmt->execute([$username]);
    $admin = $stmt->fetch();

    if ($admin && password_verify($password, $admin['password'])) {
        $_SESSION['admin_logged_in'] = true;
        header('Location: dashboard.php');
        exit;
    } else {
        $error = 'Invalid credentials';
    }
}
?>

<!DOCTYPE html>
<html>
<head>
  <title>Admin Login</title>
  <style>
    body { font-family: Arial; padding: 20px; }
    input { margin: 8px 0; padding: 8px; width: 200px; }
    button { padding: 8px 16px; }
  </style>
</head>
<body>
  <h2>Admin Login</h2>
  <?php if (!empty($error)) echo "<p style='color:red;'>$error</p>"; ?>
  <form method="post">
    <label>Username:</label><br>
    <input type="text" name="username" required /><br>
    <label>Password:</label><br>
    <input type="password" name="password" required /><br>
    <button type="submit">Login</button>
  </form>
</body>
</html>
