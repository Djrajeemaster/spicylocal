<?php
// Returns deals for sections: my, top, popular
// Query params: section=my|top|popular, location=(string), page, limit
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/config/db.php';

try {
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

  $section = isset($_GET['section']) ? strtolower($_GET['section']) : 'my';
  $location = isset($_GET['location']) ? trim($_GET['location']) : '';
  $page = max(1, (int)($_GET['page'] ?? 1));
  $limit = max(1, min(50, (int)($_GET['limit'] ?? 20)));
  $offset = ($page - 1) * $limit;

  $where = [];
  $params = [];

  // Location filter (applies to all three sections via new requirement)
  if ($location !== '') {
    // assume deals.city column exists; if not, this condition will safely fail—adapt as needed
    $where[] = " (city = :city OR location = :city) ";
    $params[':city'] = $location;
  }

  $order = " ORDER BY id DESC ";

  if ($section === 'my') {
    if (!isset($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'auth_required']); exit; }
    $uid = (int)$_SESSION['user_id'];
    // read user prefs
    $pdo->exec("CREATE TABLE IF NOT EXISTS user_preferences ( user_id INT PRIMARY KEY, categories TEXT NOT NULL DEFAULT '' ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    $st = $pdo->prepare("SELECT categories FROM user_preferences WHERE user_id = :u");
    $st->execute([':u'=>$uid]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    $cats = [];
    if ($row && trim($row['categories']) !== '') {
      $cats = array_values(array_filter(array_map('trim', explode(',', $row['categories']))));
    }
    if ($cats) {
      // assume deals.category column; build IN clause
      $in = implode(',', array_fill(0, count($cats), '?'));
      $where[] = " category IN ($in) ";
      foreach ($cats as $c) { $params[] = $c; } // positional params for IN
    }
    // relevance: higher score (upvotes - downvotes), then newest
    $order = " ORDER BY (COALESCE(upvotes,0) - COALESCE(downvotes,0)) DESC, id DESC ";
  } elseif ($section === 'top') {
    $order = " ORDER BY (COALESCE(upvotes,0) - COALESCE(downvotes,0)) DESC, id DESC ";
  } elseif ($section === 'popular') {
    // assume a view_count column; fallback score if not present
    $order = " ORDER BY COALESCE(view_count, COALESCE(upvotes,0) + COALESCE(downvotes,0)) DESC, id DESC ";
  }

  $where_sql = $where ? (" WHERE " . implode(" AND ", $where)) : "";
  $sql = "SELECT id, title, price, category, city, image, upvotes, downvotes, view_count
          FROM deals
          $where_sql
          $order
          LIMIT $limit OFFSET $offset";

  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
  echo json_encode(['ok'=>true, 'section'=>$section, 'location'=>$location, 'page'=>$page, 'limit'=>$limit, 'deals'=>$rows]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'server_error','detail'=>$e->getMessage()]);
}
