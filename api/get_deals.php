<?php
header('Content-Type: application/json');
require_once __DIR__ . '/config/db.php';

$status = $_GET['status'] ?? 'approved';
$category = $_GET['category'] ?? '';

$sql = "SELECT deals.*, users.username, users.is_verified 
        FROM deals 
        JOIN users ON deals.user_id = users.id 
        WHERE deals.status = ?";
$params = [$status];

if (!empty($category)) {
    $sql .= " AND deals.category = ?";
    $params[] = $category;
}

$sql .= " ORDER BY deals.created_at DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$deals = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($deals);
?>
