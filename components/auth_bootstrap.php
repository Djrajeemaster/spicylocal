<?php
// components/auth_bootstrap.php — start session and expose JSON for client
if (session_status() === PHP_SESSION_NONE) session_start();
header('Content-Type: text/html; charset=utf-8');
$user = null;
if (isset($_SESSION['user_id'])) {
  $user = [
    'id' => $_SESSION['user_id'],
    'username' => isset($_SESSION['username']) ? $_SESSION['username'] : '',
    'role' => isset($_SESSION['role']) ? $_SESSION['role'] : 'user',
  ];
}
?>
<script>window.SESSION_USER = <?php echo json_encode($user); ?>;</script>
