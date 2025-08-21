<?php
require_once __DIR__ . '/_bootstrap.php';
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
require_once __DIR__ . '/require_login.php';
// Returns a leaderboard of top users based on their deal contributions
// In absence of an XP field, we rank users by number of approved deals.
// Accepts optional `limit` parameter (default 10).

header('Content-Type: application/json');
require_once __DIR__ . '/config/db.php';

$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
if ($limit <= 0) $limit = 10;

try {
    $sql = "SELECT u.id, u.username, u.is_verified, u.is_verified_business,
                   COUNT(d.id) AS deals_count
            FROM users u
            LEFT JOIN deals d ON u.id = d.user_id AND d.status = 'approved'
            GROUP BY u.id
            ORDER BY deals_count DESC
            LIMIT ?";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->execute();
    $leaders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($leaders);
} catch (Exception $e) {
    echo json_encode([]);
}
?>