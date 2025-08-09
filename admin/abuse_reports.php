<?php
session_start();
require_once 'config/db.php';

// Only allow admin, moderator or super admin
if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin','moderator','super_admin'])) {
    echo "Access denied.";
    exit;
}

// Fetch abuse reports
$stmt = $pdo->prepare(
    "SELECT ar.*, d.title AS deal_title, u.username AS user_name, u.is_muted
     FROM abuse_reports ar
     JOIN deals d ON ar.deal_id = d.id
     LEFT JOIN users u ON d.user_id = u.id
     ORDER BY ar.created_at DESC"
);
$stmt->execute();
$reports = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<!DOCTYPE html>
<html>
<head>
    <title>Abuse Reports - SpicyBeats</title>
    <link rel="stylesheet" href="admin_styles.css">
    <style>
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 8px;
            border: 1px solid #ddd;
        }
        th {
            background-color: #f4f4f4;
        }
        .btn {
            padding: 4px 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .btn-mute {
            background-color: #d9534f;
            color: white;
        }
        .btn-unmute {
            background-color: #5cb85c;
            color: white;
        }
        .btn-reviewed {
            background-color: #0275d8;
            color: white;
        }
    </style>
</head>
<body>
<div style="position: absolute; top: 10px; right: 10px;">
  <a href="dashboard.php" style="margin-right:10px;">← Back to Dashboard</a>
  <a href="logout.php" style="color: red; text-decoration: none; font-weight: bold;">🚪 Logout</a>
</div>

<h1>Abuse Reports</h1>
<table>
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
    <?php foreach ($reports as $r): ?>
        <tr data-id="<?= $r['id'] ?>" data-username="<?= htmlspecialchars($r['reported_by']) ?>" data-targetuser="<?= htmlspecialchars($r['user_name']) ?>" data-muted="<?= $r['is_muted'] ?>">
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

<script>
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.mute-toggle').forEach(btn => {
    btn.addEventListener('click', function() {
      const row = this.closest('tr');
      const username = row.dataset.targetuser;
      if (!username) return;
      const action = this.classList.contains('btn-mute') ? 'mute' : 'unmute';
      fetch('../api/mute_user.php', {
        method: 'POST',
        headers: {'Content-Type':'application/x-www-form-urlencoded'},
        body: new URLSearchParams({username: username, action: action})
      }).then(res => res.json()).then(data => {
        if (data.success) {
          // Reload page to update status
          location.reload();
        } else {
          alert(data.error || 'Error updating mute status');
        }
      });
    });
  });
  document.querySelectorAll('.mark-reviewed').forEach(btn => {
    btn.addEventListener('click', function() {
      const row = this.closest('tr');
      const id = row.dataset.id;
      fetch('../api/mark_abuse_reviewed.php', {
        method: 'POST',
        headers: {'Content-Type':'application/x-www-form-urlencoded'},
        body: new URLSearchParams({id: id})
      }).then(res => res.json()).then(data => {
        if (data.success) {
          location.reload();
        } else {
          alert(data.error || 'Error marking reviewed');
        }
      });
    });
  });
});
</script>
</body>
</html>