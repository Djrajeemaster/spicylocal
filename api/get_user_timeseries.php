<?php
require_once __DIR__ . '/require_login.php';
require_once __DIR__ . '/config/db.php';
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$sql = "SELECT DATE(created_at) as date, SUM(views) as views, SUM(click_count) as clicks
        FROM deals WHERE user_id = ?
        GROUP BY DATE(created_at) ORDER BY DATE(created_at)";
$stmt = $pdo->prepare($sql);
$stmt->execute([$user_id]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode(['series'=>$rows]);