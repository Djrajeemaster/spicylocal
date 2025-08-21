<?php
require_once __DIR__ . '/_bootstrap.php';
if (($_SESSION['role'] ?? '') !== 'super_admin' && ($_SESSION['role'] ?? '') !== 'admin') { http_response_code(403); echo json_encode(['ok'=>false]); exit; }
$st = $pdo->query("SELECT bp.*, u.username FROM business_profiles bp JOIN users u ON u.id = bp.user_id ORDER BY bp.created_at DESC LIMIT 200");
echo json_encode(['ok'=>true,'items'=>$st->fetchAll(PDO::FETCH_ASSOC)]);
