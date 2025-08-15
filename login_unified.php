<?php
session_start();
require_once 'config/db.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username && $password) {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            // Set session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'] ?? 'user';

            // Also store admin flag separately
            if ($user['role'] === 'admin') {
                $_SESSION['admin'] = true;
            }

            // Determine flags for super admin role and role name for client storage
            $isSuperAdminFlag = ($user['role'] === 'super_admin') ? 1 : 0;
            $roleName         = $user['role'];
            // Escape role name for safe insertion into JavaScript
            $roleNameEsc     = addslashes($roleName);
echo "<script>
  // Persist key user attributes to localStorage for client‑side use
  localStorage.setItem('user_id', '".addslashes($user['id'])."');
  localStorage.setItem('username', '".addslashes($user['username'])."');
  localStorage.setItem('email', '".addslashes($user['email'])."');
  localStorage.setItem('joined', '".addslashes($user['created_at'])."');
  localStorage.setItem('is_verified', '".($user['is_verified'] ? '1' : '0')."');
  localStorage.setItem('is_admin', '".($user['role'] === 'admin' ? '1' : '0')."');
  localStorage.setItem('is_moderator', '".($user['role'] === 'moderator' ? '1' : '0')."');
  localStorage.setItem('is_verified_business', '".($user['is_verified_business'] ? '1' : '0')."');
  window.location.replace('index.html');
</script>";




exit;

            header("Location: index.html");
            exit;
        } else {
            $error = "Invalid credentials";
        }
    } else {
        $error = "Please fill in all fields";
    }
}
?>

<!DOCTYPE html>
<html>
\1
<!-- THEME BOOT: put before CSS to avoid FOUC -->
<script>
(function(){
  try{
    var ls = localStorage.getItem('sb_theme');
    if(ls){
      var t = JSON.parse(ls);
      var c = t.brand || t.color;
      if(c){
        var r = document.documentElement;
        r.style.setProperty('--sb-accent', c);
        r.style.setProperty('--sb-primary', c);
      }
    }
  }catch(e){}
})();
</script>

    <title>Login - SpicyBeats</title>
    <link rel="stylesheet" href="style.css">
    <style>
        .login-container {
            max-width: 400px;
            margin: 80px auto;
            padding: 30px;
            border-radius: 12px;
            background: #fff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            text-align: center;
        }

        .login-container img {
            width: 60px;
            margin-bottom: 10px;
        }

        .login-container h2 {
            margin-bottom: 20px;
            font-weight: bold;
        }

        .login-container input {
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            border-radius: 8px;
            border: 1px solid #ccc;
        }

        .login-container button {
            padding: 10px 30px;
            background: var(--color-primary, #e91e63);
            border: none;
            color: white;
            border-radius: 30px;
            cursor: pointer;
            font-weight: bold;
        }

        .error {
            color: red;
            font-size: 14px;
            margin-top: 10px;
        }

    </style>
</head>
<body>
    <div class="login-container">
        <img src="logo.png" alt="SpicyBeats">
        <h2>Welcome Back</h2>
        <form method="POST">
            <input type="text" name="username" placeholder="Username" required><br>
            <input type="password" name="password" placeholder="Password" required><br>
            <button type="submit">Login</button>
        </form>
        <?php if ($error): ?>
            <div class="error"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>
    </div>
</body>
</html>
