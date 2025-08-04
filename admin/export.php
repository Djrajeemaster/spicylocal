<?php
require_once 'config/db.php';

$status = $_GET['status'] ?? '';
$category = $_GET['category'] ?? '';

$sql = "SELECT * FROM deals WHERE 1=1";
$params = [];

if (!empty($status) && $status !== 'all') {
    $sql .= " AND status = ?";
    $params[] = $status;
}
if (!empty($category)) {
    $sql .= " AND category = ?";
    $params[] = $category;
}

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$deals = $stmt->fetchAll(PDO::FETCH_ASSOC);

header('Content-Type: text/csv');
header('Content-Disposition: attachment;filename=deals_export.csv');

$output = fopen('php://output', 'w');
fputcsv($output, ['ID', 'Title', 'Category', 'Status', 'Posted By', 'Created At']);

foreach ($deals as $deal) {
    fputcsv($output, [
        $deal['id'],
        $deal['title'],
        $deal['category'],
        $deal['status'],
        $deal['user_id'],
        $deal['created_at']
    ]);
}
fclose($output);
exit;
?>
