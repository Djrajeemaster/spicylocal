
<?php
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
require_once __DIR__ . '/require_login.php';
header('Content-Type: application/json');
require_once __DIR__ . '/config/db.php';

$data = json_decode(file_get_contents('php://input'), true);

$title = $data['title'] ?? '';
$description = $data['description'] ?? '';
$category = $data['category'] ?? '';
$image = $data['image'] ?? '';
$user_id = $data['user_id'] ?? 0;

if (!$title || !$description || !$category) {
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

$stmt = $pdo->prepare("INSERT INTO deals (title, description, category, image, user_id, status) VALUES (?, ?, ?, ?, ?, 'pending')");
$stmt->execute([$title, $description, $category, $image, $user_id]);

echo json_encode(['success' => true, 'message' => 'Deal submitted']);
?>
