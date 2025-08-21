<?php
$status = $_GET['status'] ?? 'all';
?>
<?php
session_start();
require_once 'config/db.php';

// Filtering
$status_filter = $_GET['status'] ?? 'all';
$category = $_GET['category'] ?? 'all';
$whereClause = '';
$filters = [];
$whereParts = [];

if ($status_filter !== 'all') {
    $whereParts[] = "deals.status = :status";
    $filters[':status'] = $status_filter;
}

if ($category !== 'all') {
    $whereParts[] = "deals.category = :category";
    $filters[':category'] = $category;
}

$whereClause = $whereParts ? "WHERE " . implode(" AND ", $whereParts) : "";
// ✅ Fetch all categories for dropdown
$stmt = $pdo->query("SELECT DISTINCT category FROM deals WHERE category IS NOT NULL AND category != ''");
$allCategories = $stmt->fetchAll(PDO::FETCH_COLUMN);

// Pagination
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = 10;
$offset = ($page - 1) * $limit;

// Count total for pagination
$count_query = "SELECT COUNT(*) FROM deals " . ($whereClause ?: "");
$count_stmt = $pdo->prepare($count_query);
$count_stmt->execute($filters);
$total_deals = $count_stmt->fetchColumn();
$total_pages = ceil($total_deals / $limit);

// Main query
$query = "
    SELECT deals.*, users.username,
        (SELECT COUNT(*) FROM feedback WHERE deal_id = deals.id AND feedback_type = 'useful') AS useful_count,
        (SELECT COUNT(*) FROM feedback WHERE deal_id = deals.id AND feedback_type = 'not_interested') AS not_count,
        (SELECT COUNT(*) FROM feedback WHERE deal_id = deals.id AND feedback_type = 'fake') AS fake_count,
        (SELECT COUNT(*) FROM votes WHERE deal_id = deals.id) AS vote_count,
        (SELECT COUNT(*) FROM comments WHERE deal_id = deals.id) AS comment_count
    FROM deals
    LEFT JOIN users ON deals.user_id = users.id
    $whereClause
    ORDER BY deals.created_at DESC
    LIMIT $limit OFFSET $offset
";
$stmt = $pdo->prepare($query);
$stmt->execute($filters);
$deals = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<!DOCTYPE html>
<html>
\1
<!-- THEME BOOT: put before CSS to avoid FOUC -->
<script>
(function(){
  try{
    var ls = localStorage.getItem('sb_theme');
    if(ls){
      var t = JSON.parse(ls);
      var c = t.brand || t.color;
      if(c){
        var r = document.documentElement;
        r.style.setProperty('--sb-accent', c);
        r.style.setProperty('--sb-primary', c);
      }
    }
  }catch(e){}
})();
</script>

    <title>Admin Dashboard - SpicyBeats</title>
    <link rel="stylesheet" href="admin_styles.css">
    <style>
        .icon-group span {
            margin-right: 6px;
            display: inline-block;
        }
        .view-comments {
            font-size: 12px;
            color: #2563eb;
            text-decoration: underline;
            cursor: pointer;
        }
    </style>
</head>
<body>
<div style="position: absolute; top: 10px; right: 10px;">
  <a href="logout.php" style="color: red; text-decoration: none; font-weight: bold;">🚪 Logout</a>
</div>

<h1>Admin Dashboard</h1>

<!-- Admin Filters Header -->
<style>
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin: 20px 0;
  }
  .filter-btn {
    padding: 6px 18px;
    border: none;
    border-radius: 30px;
    background-color: #eee;
    color: #333;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .filter-btn:hover {
    background-color: #ccc;
  }
  .filter-select {
    padding: 6px 12px;
    border-radius: 20px;
    border: 1px solid #ccc;
  }
  .export-btn {
    background-color: #28a745;
    color: white;
    padding: 7px 14px;
    border-radius: 25px;
    font-weight: bold;
    text-decoration: none;
  }
</style>

<div class="filter-bar">
  <!-- Status Filter Buttons -->
  <div class="status-buttons">
    <a href="?status=all" class="btn-status <?= ($status_filter === 'all') ? 'active' : '' ?>">All</a>
    <a href="?status=pending" class="btn-status <?= ($status_filter === 'pending') ? 'active' : '' ?>">Pending</a>
    <a href="?status=approved" class="btn-status <?= ($status_filter === 'approved') ? 'active' : '' ?>">Approved</a>
    <a href="?status=rejected" class="btn-status <?= ($status_filter === 'rejected') ? 'active' : '' ?>">Rejected</a>
  </div>

  <!-- Category Filter Dropdown -->
  <form method="get" action="dashboard.php" class="category-form">
    <input type="hidden" name="status" value="<?= htmlspecialchars($status_filter) ?>">
    <label for="category">Category:</label>
    <select name="category" id="category" onchange="this.form.submit()">
      <option value="all" <?= ($category === 'all') ? 'selected' : '' ?>>All</option>
      <?php foreach ($allCategories as $cat): ?>
        <option value="<?= htmlspecialchars($cat) ?>" <?= ($category === $cat) ? 'selected' : '' ?>><?= htmlspecialchars($cat) ?></option>
      <?php endforeach; ?>
    </select>
  </form>

  <!-- Export CSV Button -->
  <a href="export_csv.php?status=<?= urlencode($status_filter) ?>&category=<?= urlencode($category) ?>" class="btn-export">
    📄 Export CSV
  </a>
</div>

</div>





    <a href="?status=all"></a>
    <a href="?status=pending"></a>
    <a href="?status=approved"></a>
    <a href="?status=rejected"></a>
</div>

<div class="dashboard-container">
    <table class="deal-table">
        <thead>
            <tr>
                <th>ID</th>
                <th>Title</th>
                <th>User</th>
                <th>Status</th>
                <th>Votes / Reports</th>
                <th>Reports</th>
                <th>Comments</th>
                <th>Pin</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
        <?php foreach ($deals as $deal): ?>
            <tr>
                <td><?= $deal['id'] ?></td>
                <td><?= htmlspecialchars($deal['title']) ?></td>
                <td><?= htmlspecialchars($deal['username'] ?? 'Unknown') ?></td>
                <td><span class="status-badge status-
<form class='inline-status-form' data-id='<?= $deal['id'] ?>'>
  <select class='status-dropdown' name='status'>
    <option value='pending' <?= $deal['status'] === 'pending' ? 'selected' : '' ?>>Pending</option>
    <option value='approved' <?= $deal['status'] === 'approved' ? 'selected' : '' ?>>Approved</option>
    <option value='rejected' <?= $deal['status'] === 'rejected' ? 'selected' : '' ?>>Rejected</option>
  </select>
</form>
">
<form class='inline-status-form' data-id='<?= $deal['id'] ?>'>
  <select class='status-dropdown' name='status'>
    <option value='pending' <?= $deal['status'] === 'pending' ? 'selected' : '' ?>>Pending</option>
    <option value='approved' <?= $deal['status'] === 'approved' ? 'selected' : '' ?>>Approved</option>
    <option value='rejected' <?= $deal['status'] === 'rejected' ? 'selected' : '' ?>>Rejected</option>
  </select>
</form>
</span></td>
                <td><?= $deal['vote_count'] ?> <?= $deal['vote_count'] > 10 ? '🔥' : '' ?></td>
                <td>
                    <div class="icon-group">
                        <span>👍 <?= $deal['useful_count'] ?></span>
                        <span>🚫 <?= $deal['not_count'] ?></span>
                        <span>❗ <?= $deal['fake_count'] ?></span>
                    </div>
                </td>
                <td>
                    <?= $deal['comment_count'] ?>
                    <?php if ($deal['comment_count'] > 0): ?>
                        <div><a class="view-comments" href="/bagit/admin/view_comments.php?deal_id=<?= $deal['id'] ?>">View</a></div>
                    <?php endif; ?>
                </td>
                <td><?= isset($deal['is_pinned']) && $deal['is_pinned'] ? '📌' : '<span class="pin-faded">📌</span>' ?></td>
                <td>
                    <?php if ($deal['status'] === 'pending'): ?>
                        <a href="/bagit/admin/approve.php?id=<?= $deal['id'] ?>">✅</a>
                        <a href="/bagit/admin/reject.php?id=<?= $deal['id'] ?>">❌</a>
                    <?php endif; ?>
                    <a href="/bagit/admin/delete.php?id=<?= $deal['id'] ?>" onclick="return confirm('Delete this deal?')">🗑️</a>
                    <a href="/bagit/admin/edit.php?id=<?= $deal['id'] ?>">✏️</a>
                    <?php if ($deal['status'] === 'approved'): ?><a href="/bagit/admin/pin.php?id=<?= $deal['id'] ?>">📌</a><?php endif; ?>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>

    <div class="pagination">
        <?php if ($page > 1): ?>
            <a href="?status=<?= $status_filter ?>&page=<?= $page - 1 ?>"><button>« Prev</button></a>
        <?php endif; ?>
        <button class="active"><?= $page ?></button>
        <?php if ($page < $total_pages): ?>
            <a href="?status=<?= $status_filter ?>&page=<?= $page + 1 ?>"><button>Next »</button></a>
        <?php endif; ?>
    </div>
</div>
</body>
</html>


<script>
document.querySelectorAll('.status-dropdown').forEach(select => {
  select.addEventListener('change', function() {
    const form = this.closest('.inline-status-form');
    const id = form.getAttribute('data-id');
    const status = this.value;

    fetch('update_status.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: `id=${id}&status=${status}`
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Preserve current filters from the URL
        const params = new URLSearchParams(window.location.search);
        params.set('status', status);  // update status to what was just set
        window.location.href = `dashboard.php?${params.toString()}`;
      } else {
        alert("Update failed: " + (data.error || 'Unknown error'));
      }
    });
  });
});
</script>
