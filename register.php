<?php
require_once "config/db.php";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
  $username = trim($_POST["username"]);
  $email = trim($_POST["email"]);
  $password = $_POST["password"];
  $confirm = $_POST["confirm_password"];

  if (!isset($_POST["terms"])) {
    die("You must agree to the terms and conditions.");
  }

  if ($password !== $confirm) {
    die("Passwords do not match.");
  }

  $hashed = password_hash($password, PASSWORD_DEFAULT);

  $stmt = $pdo->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
  try {
    $stmt->execute([$username, $email, $hashed]);
    header("Location: login.php?registered=1");
  } catch (PDOException $e) {
    die("Registration failed: " . $e->getMessage());
  }
} else {
  header("Location: signup.html");
  exit;
}
?>
