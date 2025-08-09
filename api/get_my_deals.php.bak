
<?php
session_start();
header('Content-Type: application/json');
require_once 'config/db.php';

if (!isset($_SESSION['username'])) {
  echo json_encode(["success" => false, "message" => "Not logged in"]);
  exit;
}

$username = $_SESSION['username'];

try {
  $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
  $stmt->execute([$username]);
  $user = $stmt->fetch();

  if (!$user) {
    echo json_encode(["success" => false, "message" => "User not found"]);
    exit;
  }

  $user_id = $user['id'];
  $stmt = $pdo->prepare("SELECT * FROM deals WHERE user_id = ?");
  $stmt->execute([$user_id]);
  $deals = $stmt->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode($deals);
} catch (Exception $e) {
  echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
?>
