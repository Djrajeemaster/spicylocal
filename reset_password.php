<?php
session_start();
require_once __DIR__ . '/config/db.php';
$token = $_GET['token'] ?? '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Password - SpicyBeats</title>
  <link rel="stylesheet" href="global.css">
  <style>
    body { font-family: Arial, sans-serif; background:#f7f7fb; margin:0; }
    .container { max-width: 420px; margin: 80px auto; background:#fff; padding:28px; border-radius:10px; box-shadow:0 6px 24px rgba(0,0,0,0.08); }
    h2 { color: #030849; text-align:center; margin:0 0 12px; }
    input[type="password"] { width:100%; padding:12px; border:1px solid #d8d8e2; border-radius:8px; margin:10px 0; font-size:15px; }
    button { width:100%; padding:12px; background:#030849; color:#fff; border:none; border-radius:8px; font-weight:600; cursor:pointer; }
    button:hover { filter:brightness(0.95); }
    .footer { text-align:center; margin-top:14px; font-size:14px; }
    .footer a { color:#030849; text-decoration:none; }
  </style>
</head>
<body>
  <?php include("components/minimal_header.php"); ?>
  <div class="container">
    <h2>Create a New Password</h2>
    <form method="POST" action="update_password.php">
      <input type="hidden" name="token" value="<?= htmlspecialchars($token) ?>">
      <input type="password" name="password" placeholder="New Password" required>
      <input type="password" name="confirm_password" placeholder="Confirm New Password" required>
      <button type="submit">Update Password</button>
    </form>
    <div class="footer">
      <a href="login.php">Back to Login</a>
    </div>
  </div>
  <?php include("components/footer.php"); ?>
</body>
</html>
