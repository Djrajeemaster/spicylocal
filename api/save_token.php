<?php
require_once __DIR__ . '/_json_headers.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth_check_api.php';

try {
  $in = json_decode(file_get_contents('php://input'), true) ?: [];
  $username = trim($in['username'] ?? '');
  $token    = trim($in['token'] ?? '');
  $platform = trim($in['platform'] ?? '');
  if ($token === '') { http_response_code(400); echo json_encode(['ok'=>false,'error':'missing token']); exit; }

  $uid = intval($currentUserId ?? 0);
  if ($uid <= 0 && $username !== '') {
    $st = $pdo->prepare("SELECT id FROM users WHERE username = ? LIMIT 1");
    $st->execute([$username]);
    $uid = intval($st->fetchColumn() ?: 0);
  }
  if ($uid <= 0) { http_response_code(401); echo json_encode(['ok'=>false,'error':'unauthorized']); exit; }

  $pdo->exec("CREATE TABLE IF NOT EXISTS push_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    platform VARCHAR(32) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (user_id),
    CONSTRAINT fk_push_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

  $st = $pdo->prepare("INSERT INTO push_tokens (user_id, token, platform) VALUES (?, ?, ?)
                       ON DUPLICATE KEY UPDATE user_id=VALUES(user_id), platform=VALUES(platform)");
  $st->execute([intval($uid), $token, $platform]);
  echo json_encode(['ok'=>true]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error':'server','detail'=>$e->getMessage()]);
}
