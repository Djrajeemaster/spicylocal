<?php
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
// Public-read: allow guests to fetch deal
// require_once __DIR__ . '/require_login.php';
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

$dealId = isset($_GET['id']) ? intval($_GET['id']) : 0;
if (!$dealId) {
  echo json_encode(['success' => false, 'error' => 'Missing deal ID']);
  exit;
}

try {
  /*
   * Fetch detailed deal information. In addition to the base deal fields
   * stored in the `deals` table, this query joins related tables to
   * assemble a richer payload:
   *  - users.username, users.is_verified and users.is_verified_business
   *  - A comma‑separated list of tag names from deal_tags (aliased as tags)
   *  - A comma‑separated list of image paths from deal_images (aliased as images)
   *
   * The GROUP BY ensures we get one row per deal. The GROUP_CONCAT
   * functions collapse potentially many rows from the tag and image
   * tables into single comma‑delimited strings. These are exploded into
   * arrays on the PHP side before emitting JSON.
   */
  $stmt = $pdo->prepare("SELECT d.*, users.username, users.is_verified, users.is_verified_business,
                               GROUP_CONCAT(DISTINCT dt.tag_name) AS tags,
                               GROUP_CONCAT(DISTINCT di.image_path) AS images
                        FROM deals d
                        LEFT JOIN users ON d.user_id = users.id
                        LEFT JOIN deal_tags dt ON d.id = dt.deal_id
                        LEFT JOIN deal_images di ON d.id = di.deal_id
                        WHERE d.id = ?
                        GROUP BY d.id");
  $stmt->execute([$dealId]);
  $deal = $stmt->fetch(PDO::FETCH_ASSOC);

  if ($deal) {
    // Provide sensible defaults for missing values
    if (!$deal['username']) {
      $deal['username'] = 'Anonymous';
    }
    // Split tags and images into arrays
    $deal['tags'] = $deal['tags'] ? array_filter(array_map('trim', explode(',', $deal['tags']))) : [];
    $deal['images'] = $deal['images'] ? array_filter(array_map('trim', explode(',', $deal['images']))) : [];
    // Provide a thumbnail property equal to the first image (if any)
    $deal['thumbnail'] = isset($deal['images'][0]) ? $deal['images'][0] : null;
    
        // --- BEGIN added: attach nested author with role flags ---
    if (!empty($deal['user_id'])) {
      try {
        // match your users schema: is_muted, id, username, email, password, is_verified, created_at, role, is_verified_business
        $stmtAuthor = $pdo->prepare("SELECT id, username, role, is_verified, is_verified_business FROM users WHERE id = :uid LIMIT 1");
        $stmtAuthor->execute([':uid' => (int)$deal['user_id']]);
        $author = $stmtAuthor->fetch(PDO::FETCH_ASSOC);
        if ($author) {
          $role = strtolower((string)$author['role']);
          $deal['author'] = [
            'id' => (int)$author['id'],
            'username' => $author['username'],
            'role' => $role,
            // booleans you already expose; keep consistent types (ints)
            'is_verified' => (int)$author['is_verified'],
            'is_verified_business' => (int)$author['is_verified_business'],
          ];
          // Back-compat: copy onto top-level if missing so existing frontends keep working
          if (!isset($deal['username']) || $deal['username'] === null) { $deal['username'] = $author['username']; }
          if (!isset($deal['role']) || $deal['role'] === null)        { $deal['role'] = $role; }
          if (!isset($deal['is_verified']) || $deal['is_verified'] === null)                 { $deal['is_verified'] = (int)$author['is_verified']; }
          if (!isset($deal['is_verified_business']) || $deal['is_verified_business'] === null) { $deal['is_verified_business'] = (int)$author['is_verified_business']; }
        }
      } catch (Exception $e) {
        // do not fail the endpoint on author join issues
      }
    }
    // --- END added ---
echo json_encode(['success' => true, 'deal' => $deal]);
  } else {
    echo json_encode(['success' => false, 'error' => 'Deal not found']);
  }
} catch (Exception $e) {
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
