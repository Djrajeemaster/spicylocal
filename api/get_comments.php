<?php
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
// Public-read: allow guests to fetch comments
// require_once __DIR__ . '/require_login.php';
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$dealId = $_GET['id'] ?? '';
if (!$dealId) {
  echo json_encode(['success' => false, 'error' => 'Missing deal ID']);
  exit;
}

/*
 * Fetch comments along with reaction counts (likes and dislikes).
 * The LEFT JOIN on comment_reactions allows us to aggregate reactions per comment.
 */
$stmt = $pdo->prepare(
  "SELECT c.id, c.comment, u.username, c.created_at,
          SUM(CASE WHEN cr.reaction_type = 'like' THEN 1 ELSE 0 END) AS likes,
          SUM(CASE WHEN cr.reaction_type = 'dislike' THEN 1 ELSE 0 END) AS dislikes
   FROM comments c
   JOIN users u ON c.user_id = u.id
   LEFT JOIN comment_reactions cr ON cr.comment_id = c.id
   WHERE c.deal_id = ?
   GROUP BY c.id, c.comment, u.username, c.created_at
   ORDER BY c.created_at ASC"
);
$stmt->execute([$dealId]);
$comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['success' => true, 'comments' => $comments]);
?>
