<?php
session_start();
require_once __DIR__ . '/config/db.php';

// optional but recommended
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $input    = trim($_POST['username_or_email'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($input === '' || $password === '') {
        $error = "All fields are required.";
    } else {
        // ✅ use two placeholders; no HY093
        $sql  = "SELECT id, username, role, password
                 FROM users
                 WHERE username = :u OR email = :e
                 LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':u' => $input, ':e' => $input]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id']  = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role']     = $user['role'];
            header("Location: index.html"); // keep your known-good relative redirect
            exit;
        } else {
            $error = "Invalid login credentials.";
        }
    }
}
?>


<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Login - SpicyBeats</title>
  <link rel="stylesheet" href="global.css">
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      max-width: 400px;
      margin: 80px auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    h2 {
      color: #030849;
      text-align: center;
    }
    input[type="text"], input[type="password"] {
      width: 100%;
      padding: 10px;
      margin: 10px 0;
      border: 1px solid #ccc;
      border-radius: 5px;
    }
    button {
      width: 100%;
      padding: 10px;
      background-color: #030849;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
    button:hover {
      background-color: #02063a;
    }
    .form-footer {
      text-align: center;
      margin-top: 15px;
    }
    .form-footer a {
      color: #030849;
      text-decoration: none;
    }
    .error {
      color: red;
      text-align: center;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <?php include("components/minimal_header.php"); ?>
  <div class="container">
    <h2>Login</h2>
    <?php if (!empty($error)): ?>
      <div class="error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>
    <form action="login.php" method="POST">
      <input type="text" name="username_or_email" placeholder="Username or Email" required />
      <input type="password" name="password" placeholder="Password" required />
      <button type="submit">Login</button>
      <p class="mt-3 text-sm text-center">
        Don't have an account? <a href="signup.html" class="text-blue-600 hover:underline">Register here</a>
      </p>
    </form>
    <div class="form-footer">
      <a href="forgot_password.php">Forgot Password?</a>
    </div>
  </div>
  <?php include("components/footer.php"); ?>
</body>
</html>
