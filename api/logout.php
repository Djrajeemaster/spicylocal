<?php
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
session_start();
$_SESSION = [];
$params = session_get_cookie_params();
setcookie(session_name(), '', time()-42000,
  $params['path'] ?: '/',
  $params['domain'] ?: '',
  $params['secure'] ?? false,
  $params['httponly'] ?? true
);
// common custom auth cookies to clear
foreach (['remember_token','auth_token','jwt','token'] as $c) {
  setcookie($c, '', time()-42000, '/', $params['domain'] ?: '', $params['secure'] ?? false, true);
}
session_destroy();
echo json_encode(['ok'=>true]);
