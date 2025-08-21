<?php
require_once __DIR__ . '/_bootstrap.php';
if (!isset($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['ok'=>false]); exit; }
$uid = intval($_SESSION['user_id']);
$st = $pdo->prepare("SELECT m.id, m.sender_id, u.username AS sender, m.body, m.is_read, m.created_at
                     FROM messages m JOIN users u ON u.id=m.sender_id
                     WHERE m.recipient_id=? ORDER BY m.created_at DESC LIMIT 100");
$st->execute([$uid]);
echo json_encode(['ok'=>true, 'items'=>$st->fetchAll(PDO::FETCH_ASSOC)]);
