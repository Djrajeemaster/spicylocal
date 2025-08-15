<?php
require_once __DIR__ . '/_bootstrap.php';
require_once __DIR__ . '/_security.php';
require_csrf();
if (!isset($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['ok'=>false]); exit; }
$in = json_decode(file_get_contents('php://input'), true) ?: [];
$to = intval($in['to'] ?? 0);
$body = trim($in['body'] ?? '');
if (!$to || $body==='') { http_response_code(400); echo json_encode(['ok'=>false]); exit; }
$from = intval($_SESSION['user_id']);
$st = $pdo->prepare("INSERT INTO messages (thread_id, sender_id, recipient_id, body) VALUES (0,?,?,?)");
$st->execute([$from, $to, $body]);
echo json_encode(['ok'=>true]);
