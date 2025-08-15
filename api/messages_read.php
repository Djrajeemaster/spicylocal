<?php
require_once __DIR__ . '/_bootstrap.php';
require_once __DIR__ . '/_security.php';
require_csrf();
if (!isset($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['ok'=>false]); exit; }
$in = json_decode(file_get_contents('php://input'), true) ?: [];
$id = intval($in['id'] ?? 0);
$uid = intval($_SESSION['user_id']);
if ($id<=0) { http_response_code(400); echo json_encode(['ok'=>false]); exit; }
$st = $pdo->prepare("UPDATE messages SET is_read=1 WHERE id=? AND recipient_id=? LIMIT 1");
$st->execute([$id, $uid]);
echo json_encode(['ok'=>true]);
