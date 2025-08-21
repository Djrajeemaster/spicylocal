<?php
// GET: returns user's categories; POST: updates them
// Requires session auth
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/config/db.php';

try {
  if (!isset($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'auth_required']); exit; }
  $uid = (int)$_SESSION['user_id'];
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

  // Ensure table exists
  $pdo->exec("CREATE TABLE IF NOT EXISTS user_preferences (
    user_id INT PRIMARY KEY,
    categories TEXT NOT NULL DEFAULT ''
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $st = $pdo->prepare("SELECT categories FROM user_preferences WHERE user_id = :u");
    $st->execute([':u'=>$uid]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    $cats = $row ? $row['categories'] : '';
    echo json_encode(['ok'=>true,'categories'=>array_values(array_filter(array_map('trim', explode(',', $cats))))]);
    exit;
  }

  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) { $data = $_POST; }
    $cats = isset($data['categories']) ? $data['categories'] : [];
    if (is_array($cats)) { $cats = implode(',', array_map('trim', $cats)); }
    $upd = $pdo->prepare("INSERT INTO user_preferences (user_id, categories) VALUES (:u,:c)
                          ON DUPLICATE KEY UPDATE categories = VALUES(categories)");
    $upd->execute([':u'=>$uid, ':c'=>$cats]);
    echo json_encode(['ok'=>true]);
    exit;
  }

  http_response_code(405);
  echo json_encode(['ok'=>false,'error'=>'method_not_allowed']);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'server_error','detail'=>$e->getMessage()]);
}
