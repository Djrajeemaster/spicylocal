<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
  http_response_code(403);
  echo json_encode(['success'=>false,'error'=>'Forbidden']); exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$username = $input['username'] ?? '';
$flag = isset($input['is_verified_business']) ? (int)$input['is_verified_business'] : null;

if ($username === '' || $flag === null) {
  echo json_encode(['success'=>false,'error'=>'Invalid input']); exit;
}

require_once '../config/db.php';
$stmt = $pdo->prepare("UPDATE users SET is_verified_business = :flag WHERE username = :u");
$ok = $stmt->execute([':flag'=>$flag, ':u'=>$username]);

echo json_encode(['success'=>$ok]);
?>