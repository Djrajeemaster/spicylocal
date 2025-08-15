<?php
require_once __DIR__ . '/_bootstrap.php';
require_once __DIR__ . '/_security.php';
if (($_SESSION['role'] ?? '') !== 'super_admin' && ($_SESSION['role'] ?? '') !== 'admin') { http_response_code(403); echo json_encode(['ok'=>false]); exit; }
$st = $pdo->query("SELECT ar.id, ar.deal_id, u.username AS reported_by_name, ar.reported_by, ar.category, ar.note, ar.created_at
                   FROM abuse_reports ar LEFT JOIN users u ON u.id = ar.reported_by
                   ORDER BY ar.created_at DESC LIMIT 200");
$rows = $st->fetchAll(PDO::FETCH_ASSOC);
echo json_encode(['ok'=>true, 'items'=>$rows]);
