<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['admin'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

require_once 'config/db.php';

$id = $_POST['id'] ?? null;
$status = $_POST['status'] ?? null;

if ($id && in_array($status, ['pending', 'approved', 'rejected'])) {
    $stmt = $pdo->prepare("UPDATE deals SET status = ? WHERE id = ?");
    if ($stmt->execute([$status, $id])) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'DB update failed']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid data']);
}
