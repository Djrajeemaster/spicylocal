<?php
session_start();

if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: login.php');  // If not logged in, redirect to the login page
    exit;
}

require_once __DIR__ . '/../config/db.php';  // Database connection

// Expire outdated deals
$pdo->exec("UPDATE deals SET status = 'expired' WHERE expiry_timestamp IS NOT NULL AND expiry_timestamp <= NOW() AND status != 'expired'");

// Filtering & Sorting logic
$categoryFilter = isset($_GET['category']) ? $_GET['category'] : '';
$statusFilter = isset($_GET['status']) ? $_GET['status'] : '';

$perPage = 10; // Number of deals per page
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$offset = ($page - 1) * $perPage;

// Base query for deals
$sql = "SELECT * FROM deals WHERE 1";
if ($categoryFilter) {
    $sql .= " AND category = :category";
}
if ($statusFilter) {
    $sql .= " AND status = :status";
}
$sql .= " ORDER BY created_at DESC LIMIT $perPage OFFSET $offset";

// Prepare and execute query
$stmt = $pdo->prepare($sql);
if ($categoryFilter) {
    $stmt->bindParam(':category', $categoryFilter);
}
if ($statusFilter) {
    $stmt->bindParam(':status', $statusFilter);
}
$stmt->execute();
$deals = $stmt->fetchAll();

// Pagination
$totalDealsQuery = "SELECT COUNT(*) FROM deals WHERE 1";
$stmt = $pdo->prepare($totalDealsQuery);
$stmt->execute();
$totalDeals = $stmt->fetchColumn();
$totalPages = ceil($totalDeals / $perPage);

// Analytics counts
$counts = [];
foreach (['approved', 'pending', 'rejected'] as $status) {
    $cStmt = $pdo->prepare('SELECT COUNT(*) FROM deals WHERE status = ?');
    $cStmt->execute([$status]);
    $counts[$status] = $cStmt->fetchColumn();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard</title>
    <!-- Link to the CSS file -->
    <link rel="stylesheet" href="admin.css" />
</head>
<body>
    <h2>Admin Dashboard</h2>
    <p>
        <a href="logout.php">Logout</a> |
        <a href="users.php">Manage Users</a>
    </p>
    <div class="analytics">
        <strong>Approved:</strong> <?= $counts['approved'] ?> |
        <strong>Pending:</strong> <?= $counts['pending'] ?> |
        <strong>Rejected:</strong> <?= $counts['rejected'] ?>
    </div>

    <!-- Filters -->
    <form method="GET">
        <select name="category">
            <option value="">All Categories</option>
            <option value="food" <?php if ($categoryFilter == 'food') echo 'selected'; ?>>Food</option>
            <option value="electronics" <?php if ($categoryFilter == 'electronics') echo 'selected'; ?>>Electronics</option>
            <option value="clothing" <?php if ($categoryFilter == 'clothing') echo 'selected'; ?>>Clothing</option>
        </select>

        <select name="status">
            <option value="">All Statuses</option>
            <option value="pending" <?php if ($statusFilter == 'pending') echo 'selected'; ?>>Pending</option>
            <option value="approved" <?php if ($statusFilter == 'approved') echo 'selected'; ?>>Approved</option>
            <option value="rejected" <?php if ($statusFilter == 'rejected') echo 'selected'; ?>>Rejected</option>
        </select>

        <button type="submit">Filter</button>
    </form>

    <!-- Deals Table -->
    <table>
        <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Status</th>
            <th>Actions</th>
        </tr>
        <?php foreach ($deals as $deal): ?>
            <tr>
                <td><?= htmlspecialchars($deal['id']) ?></td>
                <td><?= htmlspecialchars($deal['title']) ?></td>
                <td><?= htmlspecialchars($deal['status']) ?></td>
                <td>
                    <?php if ($deal['status'] === 'pending'): ?>
                        <a class="action-btn approve" href="approve.php?id=<?= $deal['id'] ?>">Approve</a>
                        <a class="action-btn reject" href="reject.php?id=<?= $deal['id'] ?>">Reject</a>
                    <?php else: ?>
                        <span>No action</span>
                    <?php endif; ?>
                    <a class="action-btn delete" href="delete.php?id=<?= $deal['id'] ?>" onclick="return confirm('Delete this deal?')">Delete</a>
                </td>
            </tr>
        <?php endforeach; ?>
    </table>

    <!-- Pagination Links -->
    <div class="pagination">
        <?php for ($i = 1; $i <= $totalPages; $i++): ?>
            <a href="?page=<?= $i ?>&category=<?= $categoryFilter ?>&status=<?= $statusFilter ?>"><?= $i ?></a>
        <?php endfor; ?>
    </div>
</body>
</html>
