<?php
require_once __DIR__ . '/config/db.php';

header('Content-Type: application/json');

$username = $_GET['username'] ?? '';
$status = $_GET['status'] ?? 'all';

$response = ['success' => false, 'deals' => []];

if ($username) {
    $sql = "
        SELECT deals.* FROM deals
        JOIN users ON deals.user_id = users.id
        WHERE users.username = ?
    ";
    $params = [$username];

    if ($status !== 'all') {
        $sql .= " AND deals.status = ?";
        $params[] = $status;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $deals = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $response['success'] = true;
    $response['deals'] = $deals;
}

echo json_encode($response);
?>
