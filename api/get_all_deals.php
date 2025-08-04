<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$sql = "SELECT deals.*, users.username 
        FROM deals 
        LEFT JOIN users ON deals.user_id = users.id 
        WHERE deals.status = 'approved' 
        ORDER BY deals.created_at DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute();
$deals = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($deals as &$deal) {
    if (empty($deal['username'])) {
        $deal['username'] = 'Guest';
    }
}
echo json_encode($deals);

