<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

// Auto-expire outdated deals
$pdo->exec("UPDATE deals SET status = 'expired' WHERE expiry_timestamp IS NOT NULL AND expiry_timestamp <= NOW() AND status != 'expired'");

try {
    $status = 'approved';
    $category = $_GET['category'] ?? null;
    $search = $_GET['search'] ?? null;
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = 10;
    $offset = ($page - 1) * $limit;

    $sql = "
        SELECT d.*,
               COALESCE(SUM(CASE WHEN v.vote_type = 'up' THEN 1
                                 WHEN v.vote_type = 'down' THEN -1
                                 ELSE 0 END), 0) AS votes,
               AVG(r.rating) AS avg_rating
        FROM deals d
        LEFT JOIN votes v ON d.id = v.deal_id
        LEFT JOIN ratings r ON d.id = r.deal_id
        WHERE d.status = ? AND (d.expiry_timestamp IS NULL OR d.expiry_timestamp > NOW())
    ";
    $params = [$status];

    if ($category) {
        $sql .= " AND d.category = ?";
        $params[] = $category;
    }
    if ($search) {
        $sql .= " AND (d.title LIKE ? OR d.description LIKE ?)";
        $searchTerm = "%$search%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }

    $sql .= " GROUP BY d.id ORDER BY d.created_at DESC LIMIT $limit OFFSET $offset";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $deals = $stmt->fetchAll();

    echo json_encode($deals);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch deals', 'details' => $e->getMessage()]);
}
?>
