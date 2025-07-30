<?php
require_once __DIR__ . '/../config/db.php';

$currentTime = date('Y-m-d H:i:s');

// Expire deals
$stmt = $pdo->prepare("UPDATE deals SET status = 'expired' WHERE expiry_timestamp <= :current_time AND status != 'expired'");
$stmt->bindParam(':current_time', $currentTime);
$stmt->execute();

echo "Expired deals updated successfully.";
?>
