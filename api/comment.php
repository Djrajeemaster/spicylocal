
<?php
require_once __DIR__ . '/_security.php';
require_once __DIR__ . '/_bootstrap.php';
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
require_once __DIR__ . '/require_login.php';
header('Content-Type: application/json');
require_once __DIR__ . '/config/db.php';

$data = json_decode(file_get_contents('php://input'), true);
$deal_id = $data['deal_id'] ?? null;
$user_id = $data['user_id'] ?? null;
$comment = trim($data['comment'] ?? '');

if (!$deal_id || !$user_id || !$comment) {
    echo json_encode(['error' => 'Missing comment data']);
    exit;
}

$stmt = $pdo->prepare("INSERT INTO comments (deal_id, user_id, comment) VALUES (?, ?, ?)");
$stmt->execute([$deal_id, $user_id, $comment]);

echo json_encode(['success' => true, 'message' => 'Comment added']);


// Soft security guards
if (!rate_limit_soft($pdo, 'comment', 30, 60)) { http_response_code(429); echo json_encode(['ok'=>false,'error'=>'rate_limited']); exit; }
/* CSRF soft-check (not breaking old clients) */ if ($_SERVER['REQUEST_METHOD']==='POST') { check_csrf_soft(); }
