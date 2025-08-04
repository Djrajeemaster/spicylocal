<?php
require_once __DIR__ . '/../config/db.php';
header('Content-Type: application/json');

$stmt = $pdo->query("SELECT deal_id, feedback_type, COUNT(*) AS total FROM feedback GROUP BY deal_id, feedback_type");
$feedback = [];

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $dealId = $row['deal_id'];
    $type = $row['feedback_type'];
    $total = $row['total'];

    if (!isset($feedback[$dealId])) {
        $feedback[$dealId] = ['useful' => 0, 'not_interested' => 0, 'fake' => 0];
    }
    $feedback[$dealId][$type] = (int)$total;
}

echo json_encode($feedback);
?>