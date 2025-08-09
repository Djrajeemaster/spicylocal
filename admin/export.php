<?php
// Export the current filtered list of deals to CSV. Only accessible to admin and super admin users.
require_once __DIR__ . '/config/auth_check.php';
require_once __DIR__ . '/config/db.php';

$status   = $_GET['status']   ?? '';
$category = $_GET['category'] ?? '';

$sql    = 'SELECT * FROM deals WHERE 1=1';
$params = [];

// Apply status filter if provided and not "all"
if ($status !== '' && $status !== 'all') {
    $sql       .= ' AND status = ?';
    $params[]  = $status;
}
// Apply category filter if provided
if ($category !== '' && $category !== 'all') {
    $sql       .= ' AND category = ?';
    $params[]  = $category;
}

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$deals = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Send CSV headers
header('Content-Type: text/csv');
header('Content-Disposition: attachment;filename=deals_export.csv');

$output = fopen('php://output', 'w');
// CSV column headings
fputcsv($output, ['ID', 'Title', 'Category', 'Status', 'Posted By', 'Created At']);

foreach ($deals as $deal) {
    fputcsv($output, [
        $deal['id'],
        $deal['title'],
        $deal['category'],
        $deal['status'],
        $deal['user_id'],
        $deal['created_at'],
    ]);
}
fclose($output);
exit;
?>
