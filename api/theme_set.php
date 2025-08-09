<?php
session_start();
header('Content-Type: application/json');
// Allow only super_admin
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'super_admin') {
  http_response_code(403);
  echo json_encode(['ok'=>false,'error'=>'forbidden']);
  exit;
}
$input = json_decode(file_get_contents('php://input'), true);
$color = isset($input['color']) ? $input['color'] : null;
if (!$color || !preg_match('/^#[0-9A-Fa-f]{6}$/', $color)) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'invalid color']);
  exit;
}
$path = __DIR__ . '/../data/theme.json';
if (!file_exists(dirname($path))) { mkdir(dirname($path), 0777, true); }
file_put_contents($path, json_encode(['color'=>$color]));
echo json_encode(['ok'=>true,'color'=>$color]);
