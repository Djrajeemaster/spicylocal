<?php
// Strongly recommended: keep JSON clean even on warnings
// require_once __DIR__ . '/_json_headers.php';
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

$status   = isset($_GET['status'])   ? $_GET['status'] : 'approved';
$category = isset($_GET['category']) ? trim($_GET['category']) : '';
$q        = isset($_GET['q'])        ? trim($_GET['q'])        : '';
$sort     = isset($_GET['sort'])     ? $_GET['sort']           : 'heat';
$location = isset($_GET['location']) ? trim($_GET['location']) : (isset($_GET['city']) ? trim($_GET['city']) : '');

$page   = max(1, (int)($_GET['page']  ?? 1));
$limit  = min(50, max(5, (int)($_GET['limit'] ?? 10)));
$offset = ($page - 1) * $limit;

$where  = ["deals.status = ?"];
$params = [$status];

if ($category !== '') {
    $where[]  = "deals.category = ?";
    $params[] = $category;
}
if ($q !== '') {
    $where[]  = "(deals.title LIKE ? OR deals.description LIKE ?)";
    $like     = "%".$q."%";
    $params[] = $like;
    $params[] = $like;
}
/* __LOC_FILTER__ */
if ($location !== '') {
    $where[]  = "LOWER(TRIM(deals.location)) LIKE ?";
    $params[] = '%' . mb_strtolower(trim($location), 'UTF-8') . '%';
}

// Sorting using existing fields only
if ($sort === 'new') {
    $order = "deals.created_at DESC";
} elseif ($sort === 'price') {
    $order = "CAST(deals.price AS DECIMAL(10,2)) ASC";
} else {
    // "heat": views then recency
    $order = "deals.views DESC, deals.created_at DESC";
}

// If a location string is provided, prefer deals with matching location first.
$paramsSelect = $params;
if ($location !== '') {
    $order = "CASE
        WHEN LOWER(TRIM(deals.location)) = ? THEN 0
        WHEN LOWER(TRIM(deals.location)) LIKE CONCAT(?, '%') THEN 1
        WHEN LOWER(TRIM(deals.location)) LIKE CONCAT('%', ?, '%') THEN 2
        ELSE 9 END, " . $order;
    $loc = mb_strtolower(trim($location), 'UTF-8');
    $paramsSelect[] = $loc;                 // exact
    $paramsSelect[] = $loc;                 // prefix
    $paramsSelect[] = $loc;                 // substring
}

// -------- TOTAL (COUNT ONLY) --------
$sqlTotal = "SELECT COUNT(*) AS c
             FROM deals
             WHERE " . implode(" AND ", $where);
$stmt = $pdo->prepare($sqlTotal);
$stmt->execute($params);
$total = (int)$stmt->fetchColumn();

// -------- DATA (no vote/report columns here; frontend calls get_reports.php) --------
$sql = "SELECT
            deals.*,
            users.username,
            users.is_verified,
            users.is_verified_business,
            /* tags */   GROUP_CONCAT(DISTINCT dt.tag_name) AS tags,
            /* images */ MIN(di.image_path) AS thumbnail
        FROM deals
        LEFT JOIN users      ON deals.user_id = users.id
        LEFT JOIN deal_tags  dt ON deals.id   = dt.deal_id
        LEFT JOIN deal_images di ON deals.id  = di.deal_id
        WHERE " . implode(" AND ", $where) . "
        GROUP BY deals.id
        ORDER BY $order
        LIMIT $limit OFFSET $offset";

$stmt = $pdo->prepare($sql);
$stmt->execute(isset($paramsSelect) ? $paramsSelect : $params);
$items = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Build image_url with filesystem fallback to avoid 404s
$imagesDir = realpath(__DIR__ . '/../images');
$publicPrefix = '/bagit/images/';
if (is_array($items)) {
    foreach ($items as &$row) {
        $thumb = isset($row['thumbnail']) ? basename((string)$row['thumbnail']) : '';
        $candidate = $thumb ? ($imagesDir . DIRECTORY_SEPARATOR . $thumb) : '';
        if ($thumb && $imagesDir && file_exists($candidate)) {
            $row['image_url'] = $publicPrefix . $thumb;
        } else {
            $row['image_url'] = $publicPrefix . 'default.jpg';
        }
    }
    unset($row);
}



echo json_encode([
    "items" => $items,
    "total" => $total,
    "page"  => $page,
    "pages" => max(1, (int)ceil($total / $limit))
]);
