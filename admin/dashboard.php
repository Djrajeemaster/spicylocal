<?php
$EMBED_MODE = isset($_GET['embed']) && $_GET['embed']==='1';

// Administrative dashboard for viewing and moderating deals.
// Only accessible to admin and super admin users.

// Start the session and enforce access control via common auth check.
require_once __DIR__ . '/config/auth_check.php';
require_once __DIR__ . '/config/db.php';

// Preserve optional status filter from query string
$status = $_GET['status'] ?? 'all';

// Determine the logged-in user's role for permission-based UI (admin vs moderator)
$role = $_SESSION['role'] ?? 'user';

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

// Fetch abuse reports for admin and moderator view
$abuseReports = [];
if (in_array($role, ['admin','moderator','super_admin'])) {
    try {
        $stmtAbuse = $pdo->prepare(
            "SELECT ar.*, d.title AS deal_title, u.username AS user_name, u.is_muted
             FROM abuse_reports ar
             JOIN deals d ON ar.deal_id = d.id
             LEFT JOIN users u ON d.user_id = u.id
             ORDER BY ar.created_at DESC"
        );
        $stmtAbuse->execute();
        $abuseReports = $stmtAbuse->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        $abuseReports = [];
    }
}

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
<?php if (!$EMBED_MODE): ?>
    <script src="/bagit/loadHeader.v2.js?v=absfix2" defer></script>
<?php endif; ?>
</head>
<body>
    <?php if (!$EMBED_MODE): ?>
<div id="global-header"></div>
<?php endif; ?>
<div style="position: absolute; top: 10px; right: 10px;">
  <a href="logout.php" style="color: red; text-decoration: none; font-weight: bold;">🚪 Logout</a>
</div>

<h1>Admin Dashboard</h1>

<?php if (in_array($role, ['admin','super_admin'])): ?>
  <div style="margin-bottom: 10px;">
    <a href="users.php" style="background-color:#e91e63;color:#fff;padding:6px 12px;border-radius:4px;text-decoration:none;font-weight:bold;">👥 Manage Users</a>
  </div>
<?php endif; ?>

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

  /* Buttons for abuse reports actions */
  .btn {
    padding: 4px 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .btn-mute {
    background-color: #d9534f;
    color: #fff;
  }
  .btn-unmute {
    background-color: #5cb85c;
    color: #fff;
  }
  .btn-reviewed {
    background-color: #0275d8;
    color: #fff;
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

  <!-- Export CSV Button (hidden for moderators) -->
  <?php if ($role !== 'moderator'): ?>
  <a href="export_csv.php?status=<?= urlencode($status_filter) ?>&category=<?= urlencode($category) ?>" class="btn-export">
    📄 Export CSV
  </a>
  <?php endif; ?>
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
                <?php if ($role !== 'moderator'): ?>
                    <th>Actions</th>
                <?php endif; ?>
            </tr>
        </thead>
        <tbody>
        <?php foreach ($deals as $deal): ?>
            <tr>
                <td><?= $deal['id'] ?></td>
                <td><?= htmlspecialchars($deal['title']) ?></td>
                <td><?= htmlspecialchars($deal['username'] ?? 'Unknown') ?></td>
                <td>
                    <!-- Status badge showing the current deal status -->
                    <?php
                        $status = $deal['status'];
                        $statusClass = 'status-' . htmlspecialchars($status);
                    ?>
                    <span class="status-badge <?= $statusClass ?>"><?= ucfirst(htmlspecialchars($status)) ?></span>
                    <!-- Inline form to update status. Displayed alongside the badge -->
                    <form class="inline-status-form" data-id="<?= $deal['id'] ?>" style="display:inline-block;margin-left:6px;">
                      <select class="status-dropdown" name="status">
                        <option value="pending" <?= $status === 'pending' ? 'selected' : '' ?>>Pending</option>
                        <option value="approved" <?= $status === 'approved' ? 'selected' : '' ?>>Approved</option>
                        <option value="rejected" <?= $status === 'rejected' ? 'selected' : '' ?>>Rejected</option>
                      </select>
                    </form>
                </td>
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
                <?php if ($role !== 'moderator'): ?>
                <td>
                    <?php if ($deal['status'] === 'pending'): ?>
                        <a href="/bagit/admin/approve.php?id=<?= $deal['id'] ?>">✅</a>
                        <a href="/bagit/admin/reject.php?id=<?= $deal['id'] ?>">❌</a>
                    <?php endif; ?>
                    <a href="/bagit/admin/delete.php?id=<?= $deal['id'] ?>" onclick="return confirm('Delete this deal?')">🗑️</a>
                    <a href="/bagit/admin/edit.php?id=<?= $deal['id'] ?>">✏️</a>
                    <?php if ($deal['status'] === 'approved'): ?><a href="/bagit/admin/pin.php?id=<?= $deal['id'] ?>">📌</a><?php endif; ?>
                </td>
                <?php endif; ?>
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

<?php if (in_array($role, ['admin','moderator','super_admin'])): ?>
  <hr style="margin:40px 0;">
  <h2>Abuse Reports</h2>
  <table class="deal-table">
    <thead>
      <tr>
        <th>ID</th>
        <th>Deal ID</th>
        <th>Deal Title</th>
        <th>Reported By</th>
        <th>Reason</th>
        <th>Reported At</th>
        <th>Reviewed</th>
        <th>User Muted?</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($abuseReports as $r): ?>
        <tr data-id="<?= $r['id'] ?>" data-targetuser="<?= htmlspecialchars($r['user_name']) ?>" data-muted="<?= $r['is_muted'] ?>">
          <td><?= $r['id'] ?></td>
          <td><?= $r['deal_id'] ?></td>
          <td><?= htmlspecialchars($r['deal_title']) ?></td>
          <td><?= htmlspecialchars($r['reported_by']) ?></td>
          <td><?= nl2br(htmlspecialchars($r['reason'])) ?></td>
          <td><?= htmlspecialchars($r['created_at']) ?></td>
          <td><?= $r['reviewed'] ? 'Yes' : 'No' ?></td>
          <td><?= $r['is_muted'] ? 'Yes' : 'No' ?></td>
          <td>
            <?php if ($r['is_muted']): ?>
              <button class="btn btn-unmute mute-toggle">Unmute</button>
            <?php else: ?>
              <button class="btn btn-mute mute-toggle">Mute</button>
            <?php endif; ?>
            <?php if (!$r['reviewed']): ?>
              <button class="btn btn-reviewed mark-reviewed">Mark Reviewed</button>
            <?php endif; ?>
          </td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
<?php endif; ?>
</body>
</html>


<script>
// Status dropdown change handler
document.querySelectorAll('.status-dropdown').forEach(select => {
  select.addEventListener('change', function() {
    const form   = this.closest('.inline-status-form');
    const id     = form.getAttribute('data-id');
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
        params.set('status', status);
        window.location.href = `dashboard.php?${params.toString()}`;
      } else {
        alert("Update failed: " + (data.error || 'Unknown error'));
      }
    });
  });
});

// Mute/unmute buttons in the abuse reports table
document.querySelectorAll('.mute-toggle').forEach(btn => {
  btn.addEventListener('click', function() {
    const row      = this.closest('tr');
    const username = row.getAttribute('data-targetuser');
    if (!username) return;
    const action   = this.classList.contains('btn-mute') ? 'mute' : 'unmute';
    fetch('../api/mute_user.php', {
      method: 'POST',
      headers: {'Content-Type':'application/x-www-form-urlencoded'},
      body: new URLSearchParams({ username: username, action: action })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        location.reload();
      } else {
        alert(data.error || 'Error updating user');
      }
    });
  });
});

// Mark abuse report as reviewed
document.querySelectorAll('.mark-reviewed').forEach(btn => {
  btn.addEventListener('click', function() {
    const row = this.closest('tr');
    const id  = row.getAttribute('data-id');
    fetch('../api/mark_abuse_reviewed.php', {
      method: 'POST',
      headers: {'Content-Type':'application/x-www-form-urlencoded'},
      body: new URLSearchParams({ id: id })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        location.reload();
      } else {
        alert(data.error || 'Error marking reviewed');
      }
    });
  });
});
</script>
