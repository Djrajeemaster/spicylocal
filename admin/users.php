<?php
require_once 'config/auth_check.php';
require_once 'config/db.php';

 // Fetch username, role, verified business and mute status for user management
 $stmt = $pdo->query("SELECT username, role, is_verified_business, is_muted FROM users ORDER BY username");
 $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html>
<head>
  <title>Manage Users</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="../style.css" />
  <link rel="stylesheet" href="../header.css" />
  <script src="/bagit/loadHeader.v2.js?v=2025-08-08" defer></script>
  <style>
    table {
      width: 90%%;
      margin: 40px auto;
      border-collapse: collapse;
      background: #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    th, td {
      padding: 12px 16px;
      border: 1px solid #ddd;
      text-align: left;
    }
    th {
      background-color: #f7f7f7;
    }
    h2 {
      text-align: center;
      margin-top: 30px;
    }
  </style>
</head>
<body>
<div id="global-header"></div>

<h2>User Management</h2>
<table>
  <thead>
    <tr>
      <th>Username</th>
      <th>Role</th>
      <th>Verified Business</th>
      <th>Muted</th>
      <th>Action</th>
    </tr>
  </thead>
  <tbody>
    <?php foreach ($users as $user): ?>
      <tr>
        <td><?= htmlspecialchars($user['username']) ?></td>
        <td><?= htmlspecialchars($user['role']) ?></td>
        <td>
          <input type="checkbox" class="vb-toggle"
            data-username="<?= htmlspecialchars($user['username']) ?>"
            <?= $user['is_verified_business'] ? 'checked' : '' ?> />
        </td>
        <td><?= $user['is_muted'] ? 'Yes' : 'No' ?></td>
        <td>
          <?php
            $canToggleMute = true;
            // Prevent mods from muting admins or other mods
            $currentRole = $_SESSION['role'] ?? 'user';
            $targetRole = $user['role'];
            if ($currentRole === 'moderator' && in_array($targetRole, ['admin','moderator','super_admin'])) {
              $canToggleMute = false;
            }
            // Only super admins can mute/unmute admins or super_admins
            if ($currentRole === 'admin' && in_array($targetRole, ['admin','super_admin'])) {
              $canToggleMute = false;
            }
            // Do not allow muting self
            if ($user['username'] === ($_SESSION['username'] ?? '')) {
              $canToggleMute = false;
            }
          ?>
          <?php if ($canToggleMute): ?>
            <button class="mute-btn" data-username="<?= htmlspecialchars($user['username']) ?>" data-action="<?= $user['is_muted'] ? 'unmute' : 'mute' ?>">
              <?= $user['is_muted'] ? 'Unmute' : 'Mute' ?>
            </button>
          <?php else: ?>
            <span>N/A</span>
          <?php endif; ?>
        </td>
      </tr>
    <?php endforeach; ?>
  </tbody>
</table>

<script>
document.querySelectorAll('.vb-toggle').forEach(cb => {
  cb.addEventListener('change', () => {
    fetch('../api/toggle_business_verification.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        username: cb.dataset.username,
        is_verified_business: cb.checked ? 1 : 0
      })
    })
    .then(r => r.json())
    .then(j => {
      if (!j.success) {
        alert(j.error || 'Update failed');
        cb.checked = !cb.checked;
      }
    })
    .catch(() => {
      alert('Network error');
      cb.checked = !cb.checked;
    });
  });
});

// Handle mute/unmute button clicks
document.querySelectorAll('.mute-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const username = btn.dataset.username;
    const action = btn.dataset.action;
    fetch('../api/mute_user.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams({ username: username, action: action })
    })
    .then(res => res.json())
    .then(j => {
      if (j.success) {
        // Reload to reflect change
        window.location.reload();
      } else {
        alert(j.error || 'Mute/unmute failed');
      }
    })
    .catch(() => alert('Network error'));
  });
});
</script>
</body>
</html>