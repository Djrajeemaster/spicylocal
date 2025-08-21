<?php
require_once 'config/auth_check.php';
require_once 'config/db.php';

$deal_id = $_GET['deal_id'] ?? 0;

$stmt = $pdo->prepare("SELECT comments.*, users.username FROM comments LEFT JOIN users ON comments.user_id = users.id WHERE comments.deal_id = ?");
$stmt->execute([$deal_id]);
$comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html>
\1
<!-- THEME BOOT: put before CSS to avoid FOUC -->
<script>
(function(){
  try{
    var ls = localStorage.getItem('sb_theme');
    if(ls){
      var t = JSON.parse(ls);
      var c = t.brand || t.color;
      if(c){
        var r = document.documentElement;
        r.style.setProperty('--sb-accent', c);
        r.style.setProperty('--sb-primary', c);
      }
    }
  }catch(e){}
})();
</script>

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
