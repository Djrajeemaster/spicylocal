<?php
require_once __DIR__ . '/../config/db.php';
header('Content-Type: application/json');

$votesStmt = $pdo->query("SELECT deal_id, vote_type, COUNT(*) AS total FROM votes GROUP BY deal_id, vote_type");
$voteCounts = [];

while ($row = $votesStmt->fetch(PDO::FETCH_ASSOC)) {
    $dealId = $row['deal_id'];
    $type = $row['vote_type'];
    $total = $row['total'];

    if (!isset($voteCounts[$dealId])) {
        $voteCounts[$dealId] = ['up' => 0, 'down' => 0];
    }
    $voteCounts[$dealId][$type] = (int)$total;
}

echo json_encode($voteCounts);
?>