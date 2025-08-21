<?php
header('Content-Type: application/json');
session_start();
$role = $_SESSION['role'] ?? null;
$isAdmin = (!empty($_SESSION['admin']) || $role === 'super_admin') ? true : false;

echo json_encode([
  'ok'    => isset($_SESSION['user_id']),
  'role'  => $role,
  'admin' => $isAdmin
]);
