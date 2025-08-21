<?php
// /bagit/api/deals_list.php — ultra-safe version (no unknown columns)
// Uses constants for metrics until you share real column names.

require_once __DIR__ . '/../admin/config/auth_check.php';
require_once __DIR__ . '/../admin/config/db.php';
header('Content-Type: application/json');

$page  = max(1, (int)($_GET['page'] ?? 1));
$limit = max(1, min(100, (int)($_GET['limit'] ?? 10)));
$offset = ($page - 1) * $limit;

$status = trim($_GET['status'] ?? '');
$q      = trim($_GET['q'] ?? '');

$where = []; $params = [];
if ($status !== '') { $where[] = "d.status = :status"; $params[':status'] = $status; }
if ($q !== '')      { $where[] = "d.title LIKE :q";     $params[':q'] = '%' . $q . '%'; }

$from = "FROM deals d LEFT JOIN users u ON d.user_id = u.id";
$whereSql = $where ? (' WHERE ' . implode(' AND ', $where)) : '';

try {
  $stmt = $pdo->prepare("SELECT COUNT(*) $from $whereSql");
  $stmt->execute($params);
  $total = (int)$stmt->fetchColumn();
  $total_pages = max(1, (int)ceil($total / $limit));
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error'=>'DB error (count)', 'detail'=>$e->getMessage()]); exit;
}

try {
  // NOTE: use constants for columns that differed in your DB (upvotes/fake/comments/is_pinned)
  $sql = "SELECT d.id, d.title, d.status,
            0 AS upvotes,
            0 AS fake,
            0 AS comments,
            0 AS is_pinned,
            COALESCE(u.username, '') AS username
          $from $whereSql
          ORDER BY d.id DESC
          LIMIT :limit OFFSET :offset";
  $stmt = $pdo->prepare($sql);
  foreach ($params as $k=>$v) { $stmt->bindValue($k, $v); }
  $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
  $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
  $stmt->execute();
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error'=>'DB error (rows)', 'detail'=>$e->getMessage()]); exit;
}

echo json_encode([
  'page'=>$page, 'limit'=>$limit, 'total'=>$total, 'total_pages'=>$total_pages,
  'categories'=>[],
  'deals'=>array_map(function($r){
    return [
      'id'=>(int)$r['id'],
      'title'=>$r['title'],
      'status'=>$r['status'],
      'upvotes'=>(int)$r['upvotes'],
      'fake'=>(int)$r['fake'],
      'comments'=>(int)$r['comments'],
      'is_pinned'=>(int)$r['is_pinned'],
      'username'=>$r['username']
    ];
  }, $rows)
]);
