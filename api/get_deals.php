<?php
header('Content-Type: application/json');
require_once __DIR__ . '/config/db.php';

/**
 * Params:
 * - status: approved|pending|rejected (default: approved)
 * - category: optional
 * - q: search in title/description
 * - sort: heat|new|price (default: heat -> views DESC, created_at DESC)
 * - page: 1+
 * - limit: 5..50 (default: 10)
 */

$status   = $_GET['status']  ?? 'approved';
$category = trim($_GET['category'] ?? '');
$q        = trim($_GET['q'] ?? '');
$sort     = $_GET['sort'] ?? 'heat';

$page  = max(1, (int)($_GET['page'] ?? 1));
$limit = min(50, max(5, (int)($_GET['limit'] ?? 10)));
$offset = ($page - 1) * $limit;

$where = ["deals.status = ?"];
$params = [$status];

if ($category !== '') {
    $where[] = "deals.category = ?";
    $params[] = $category;
}
if ($q !== '') {
    $where[] = "(deals.title LIKE ? OR deals.description LIKE ?)";
    $like = "%".$q."%";
    $params[] = $like;
    $params[] = $like;
}

// Sorting using existing fields only
if ($sort === 'new') {
    $order = "deals.created_at DESC";
} elseif ($sort === 'price') {
    $order = "CAST(deals.price AS DECIMAL(10,2)) ASC";
} else {
    $order = "deals.views DESC, deals.created_at DESC";
}

// Total count (no joins needed)
$sqlTotal = "SELECT COUNT(*) AS c
             FROM deals
             WHERE " . implode(" AND ", $where);
$stmt = $pdo->prepare($sqlTotal);
$stmt->execute($params);
$total = (int)$stmt->fetchColumn();

// Data with your previous joins preserved
$sql = "SELECT deals.*,
               users.username, users.is_verified, users.is_verified_business,
               " . (/* tags */ 1 ? "GROUP_CONCAT(DISTINCT dt.tag_name) AS tags," : "") . "
               " . (/* images */ 1 ? "MIN(di.image_path) AS thumbnail" : "NULL AS thumbnail") . "
        FROM deals
        LEFT JOIN users ON deals.user_id = users.id
        " . ("LEFT JOIN deal_tags dt ON deals.id = dt.deal_id") . "
        " . ("LEFT JOIN deal_images di ON deals.id = di.deal_id") . "
        WHERE " . implode(" AND ", $where) . "
        GROUP BY deals.id
        ORDER BY $order
        LIMIT $limit OFFSET $offset";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$items = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    "items" => $items,
    "total" => $total,
    "page"  => $page,
    "pages" => max(1, (int)ceil($total / $limit))
]);

