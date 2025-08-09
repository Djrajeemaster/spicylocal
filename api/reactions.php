<?php
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
require_once __DIR__ . '/require_login.php';
/**
 * Toggle a reaction (like/dislike) on a comment. The client sends a JSON
 * payload with `comment_id`, `username` and `type` ('like' or 'dislike').
 * If the user already reacted with the same type, the reaction is removed.
 * If the user reacted with the opposite type, the reaction is updated.
 * Otherwise, a new reaction record is inserted.
 *
 * This endpoint returns the updated like and dislike counts for the
 * specified comment. It requires that a `comment_reactions` table exist
 * with columns (id, comment_id, user_id, reaction_type). It also
 * requires that the `users` table stores unique usernames.
 */
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);
$commentId = isset($data['comment_id']) ? intval($data['comment_id']) : 0;
$username  = isset($data['username']) ? trim($data['username']) : '';
$type      = isset($data['type']) ? trim($data['type']) : '';

if (!$commentId || !$username || !in_array($type, ['like', 'dislike'])) {
  echo json_encode(['success' => false, 'error' => 'Invalid parameters']);
  exit;
}

try {
  // Retrieve user id from username
  $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? LIMIT 1");
  $stmt->execute([$username]);
  $userRow = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$userRow) {
    echo json_encode(['success' => false, 'error' => 'User not found']);
    exit;
  }
  $userId = intval($userRow['id']);

  // Check for existing reaction
  $stmt = $pdo->prepare("SELECT id, reaction_type FROM comment_reactions WHERE comment_id = ? AND user_id = ? LIMIT 1");
  $stmt->execute([$commentId, $userId]);
  $existing = $stmt->fetch(PDO::FETCH_ASSOC);

  if ($existing) {
    if ($existing['reaction_type'] === $type) {
      // Same reaction exists: remove it (toggle off)
      $del = $pdo->prepare("DELETE FROM comment_reactions WHERE id = ?");
      $del->execute([$existing['id']]);
    } else {
      // Different reaction exists: update to new type
      $upd = $pdo->prepare("UPDATE comment_reactions SET reaction_type = ? WHERE id = ?");
      $upd->execute([$type, $existing['id']]);
    }
  } else {
    // No reaction yet: insert new
    $ins = $pdo->prepare("INSERT INTO comment_reactions (comment_id, user_id, reaction_type) VALUES (?, ?, ?)");
    $ins->execute([$commentId, $userId, $type]);
  }

  // Fetch updated counts
  $countStmt = $pdo->prepare(
    "SELECT
       SUM(CASE WHEN reaction_type = 'like' THEN 1 ELSE 0 END) AS likes,
       SUM(CASE WHEN reaction_type = 'dislike' THEN 1 ELSE 0 END) AS dislikes
     FROM comment_reactions
     WHERE comment_id = ?"
  );
  $countStmt->execute([$commentId]);
  $counts = $countStmt->fetch(PDO::FETCH_ASSOC);
  $likes = intval($counts['likes'] ?? 0);
  $dislikes = intval($counts['dislikes'] ?? 0);

  echo json_encode(['success' => true, 'likes' => $likes, 'dislikes' => $dislikes]);
} catch (Exception $e) {
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>