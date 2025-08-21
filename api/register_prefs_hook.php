<?php

// === Save user preference categories if provided ===
try {
  if (!isset($pdo)) { require_once __DIR__ . '/config/db.php'; }
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $pdo->exec("CREATE TABLE IF NOT EXISTS user_preferences (
    user_id INT PRIMARY KEY,
    categories TEXT NOT NULL DEFAULT ''
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
  $cats = isset($_POST['categories']) ? trim($_POST['categories']) : '';
  if ($cats !== '') {
    $ins = $pdo->prepare("INSERT INTO user_preferences (user_id, categories) VALUES (:u,:c)
                          ON DUPLICATE KEY UPDATE categories = VALUES(categories)");
    $ins->execute([":u" => $newUserId, ":c" => $cats]);
  }
} catch (Throwable $e) {
  // silent fail for preferences to avoid blocking signup
}

