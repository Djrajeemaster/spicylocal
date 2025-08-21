<?php
// Mark an abuse report as reviewed
// Accepts POST parameter: id (abuse report id)
// Only admins or moderators can call

header('Content-Type: application/json');
session_start();
require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request']);
    exit;
}

$role = $_SESSION['role'] ?? '';
if (!in_array($role, ['admin','moderator','super_admin'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$reportId = isset($_POST['id']) ? intval($_POST['id']) : 0;
if ($reportId <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid report id']);
    exit;
}

try {
    $stmt = $pdo->prepare('UPDATE abuse_reports SET reviewed = 1 WHERE id = :id');
    $stmt->execute([':id' => $reportId]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}