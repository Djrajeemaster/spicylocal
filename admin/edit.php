<?php
require_once "config/db.php";
$id = $_GET['id'] ?? 0;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $title = $_POST['title'];
  $description = $_POST['description'];
  $category = $_POST['category'];
  $status = $_POST['status'];  

  $stmt = $pdo->prepare("UPDATE deals SET title = ?, description = ?, category = ?, status = ? WHERE id = ?");
  $stmt->execute([$title, $description, $category, $status, $id]);

  header("Location: dashboard.php");
  exit;
}

$stmt = $pdo->prepare("SELECT * FROM deals WHERE id = ?");
$stmt->execute([$id]);
$deal = $stmt->fetch();
?>
<!DOCTYPE html>
<html>
<head><title>Edit Deal</title></head>
<body>
  <h2>Edit Deal</h2>
  <form method="POST">
    <label>Title: <input type="text" name="title" value="<?= htmlspecialchars($deal['title']) ?>" /></label><br/>
    <label>Description: <textarea name="description"><?= htmlspecialchars($deal['description']) ?></textarea></label><br/>
    <label>Category: <input type="text" name="category" value="<?= htmlspecialchars($deal['category']) ?>" /></label><br/>
    <button type="submit">Update</button>
  
    <label for="status">Status:</label>
    <select name="status" id="status">
        <option value="pending" <?= $deal['status'] === 'pending' ? 'selected' : '' ?>>Pending</option>
        <option value="approved" <?= $deal['status'] === 'approved' ? 'selected' : '' ?>>Approved</option>
        <option value="rejected" <?= $deal['status'] === 'rejected' ? 'selected' : '' ?>>Rejected</option>
    </select><br><br>
    </form>
</body>
</html>