<?php
require_once 'config/auth_check.php';
require_once 'config/db.php';

$deal_id = isset($_GET['deal_id']) ? (int)$_GET['deal_id'] : 0;

$stmt = $pdo->prepare("SELECT comments.*, users.username FROM comments LEFT JOIN users ON comments.user_id = users.id WHERE comments.deal_id = ?");
$stmt->execute([$deal_id]);
$comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html>
<head>
  <title>Deal Comments</title>
</head>
<body>
  <h2>Comments for Deal #<?= htmlspecialchars($deal_id) ?></h2>
  <?php foreach ($comments as $comment): ?>
    <div>
      <strong><?= htmlspecialchars($comment['username'] ?? 'Guest') ?>:</strong>
      <?= htmlspecialchars($comment['comment']) ?>
    </div>
  <?php endforeach; ?>
</body>
</html>
