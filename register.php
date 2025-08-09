<?php
require_once 'config/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $username = trim($_POST['username'] ?? '');
  $email = trim($_POST['email'] ?? '');
  $password = $_POST['password'] ?? '';

  if (empty($username) || empty($email) || empty($password)) {
    die("All fields are required.");
  }

  // Check if username already exists
  $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
  $stmt->execute([$username]);
  if ($stmt->fetch()) {
    die("Username already taken.");
  }

  // Check if email already exists
  $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
  $stmt->execute([$email]);
  if ($stmt->fetch()) {
    die("Email already registered.");
  }

  // Hash password and insert
  $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
  $stmt = $pdo->prepare("INSERT INTO users (username, email, password, is_verified) VALUES (?, ?, ?, 0)");
  $stmt->execute([$username, $email, $hashedPassword]);

  echo "<script>
    alert('Signup successful! Please login.');
    window.location.href = 'login.html';
  </script>";
  exit;
}
?>
