<?php
// admin/api/deals_list.php (ROBUST)
// Returns: { page, limit, total, total_pages, categories:[{name,slug}], deals:[...] }
require_once __DIR__ . '/../config/auth_check.php';
require_once __DIR__ . '/../config/db.php';
header('Content-Type: application/json');

try {
  $page   = max(1, (int)($_GET['page'] ?? 1));
  $limit  = max(1, min(100, (int)($_GET['limit'] ?? 10)));
  $offset = ($page - 1) * $limit;

  $status   = trim($_GET['status'] ?? '');
  $category = trim($_GET['category'] ?? '');
  $q        = trim($_GET['q'] ?? '');

  $where = [];
  $params = [];

  if ($status !== '') {
    $where[] = "d.status = :status";
    $params[':status'] = $status;
  }
  if ($category !== '') {
    // Using text category on deals table for compatibility
    $where[] = "d.category = :category";
    $params[':category'] = $category;
  }
  if ($q !== '') {
    $where[] = "(d.title LIKE :q OR d.description LIKE :q)";
    $params[':q'] = "%{$q}%";
  }

  $whereSql = $where ? ("WHERE " . implode(" AND ", $where)) : "";

  // Count total
  $stmt = $pdo->prepare("SELECT COUNT(*) FROM deals d $whereSql");
  $stmt->execute($params);
  $total = (int)$stmt->fetchColumn();

  // Page rows with safe aggregates
  $sql = "SELECT
            d.id, d.title, d.status, COALESCE(d.category,'') AS category, d.user_id,
            COALESCE(u.username,'') AS username,
            COALESCE(v.upvotes,0) AS upvotes,
            COALESCE(f.fake_reports,0) AS fake_reports,
            COALESCE(cm.comments_count,0) AS comments_count,
            COALESCE(d.is_pinned,0) AS is_pinned
          FROM deals d
          LEFT JOIN users u ON u.id = d.user_id
          LEFT JOIN (
            SELECT deal_id, SUM(CASE WHEN vote_type='up' THEN 1 ELSE 0 END) AS upvotes
            FROM votes GROUP BY deal_id
          ) v ON v.deal_id = d.id
          LEFT JOIN (
            SELECT deal_id, SUM(CASE WHEN feedback_type='fake' THEN 1 ELSE 0 END) AS fake_reports
            FROM feedback GROUP BY deal_id
          ) f ON f.deal_id = d.id
          LEFT JOIN (
            SELECT deal_id, COUNT(*) AS comments_count
            FROM comments GROUP BY deal_id
          ) cm ON cm.deal_id = d.id
          $whereSql
          ORDER BY d.created_at DESC, d.id DESC
          LIMIT :limit OFFSET :offset";
  $stmt = $pdo->prepare($sql);
  foreach ($params as $k => $v) { $stmt->bindValue($k, $v); }
  $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
  $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
  $stmt->execute();
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

  // Categories for dropdown — prefer categories table if present, fallback to distinct deals.category
  $categories = [];
  try {
    $test = $pdo->query("SHOW TABLES LIKE 'categories'");
    if ($test && $test->rowCount() > 0) {
      $cstmt = $pdo->query("SELECT name, COALESCE(slug, name) AS slug FROM categories ORDER BY name ASC");
      $categories = $cstmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    } else {
      $cstmt = $pdo->query("SELECT DISTINCT category AS name FROM deals WHERE category IS NOT NULL AND category <> '' ORDER BY category ASC");
      $tmp = $cstmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
      foreach ($tmp as $r) { $categories[] = ['name'=>$r['name'], 'slug'=>$r['name']]; }
    }
  } catch (Throwable $e) {
    // Fallback
    try {
      $cstmt = $pdo->query("SELECT DISTINCT category AS name FROM deals WHERE category IS NOT NULL AND category <> '' ORDER BY category ASC");
      $tmp = $cstmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
      foreach ($tmp as $r) { $categories[] = ['name'=>$r['name'], 'slug'=>$r['name']]; }
    } catch (Throwable $e2) {
      $categories = [];
    }
  }

  echo json_encode([
    'page' => $page,
    'limit' => $limit,
    'total' => $total,
    'total_pages' => max(1, (int)ceil($total / $limit)),
    'categories' => $categories,
    'deals' => array_map(function($r){
      return [
        'id' => (int)$r['id'],
        'title' => $r['title'],
        'status' => $r['status'],
        'upvotes' => (int)$r['upvotes'],
        'fake' => (int)$r['fake_reports'],
        'comments' => (int)$r['comments_count'],
        'is_pinned' => (int)$r['is_pinned'],
        'username' => $r['username'],
        'category' => $r['category']
      ];
    }, $rows)
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  // Surface the error in JSON to make debugging obvious in the network tab
  echo json_encode(['ok'=>false, 'error'=>'server', 'detail'=>$e->getMessage()]);
}
