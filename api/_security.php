<?php
// _security.php — CSRF + rate limit helpers (soft-enforce to avoid breaking flows)

if (!function_exists('csrf_token')) {
  function csrf_token() {
    if (session_status() === PHP_SESSION_NONE) session_start();
    if (empty($_SESSION['csrf_token'])) {
      $_SESSION['csrf_token'] = bin2hex(random_bytes(16));
    }
    return $_SESSION['csrf_token'];
  }
}

if (!function_exists('check_csrf_soft')) {
  function check_csrf_soft() {
    // Accept if header matches or same-origin via Referer
    $hdr = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $ok = hash_equals(csrf_token(), $hdr);
    if (!$ok) {
      // try origin check (same host) for backward compatibility
      $ref = $_SERVER['HTTP_REFERER'] ?? '';
      if ($ref) {
        $host = $_SERVER['HTTP_HOST'] ?? '';
        if ($host && strpos($ref, $host) !== false) $ok = true;
      }
      // Signal the client it's missing CSRF in future
      header('X-CSRF-Required: 1');
    }
    return $ok;
  }
}

if (!function_exists('rate_limit_soft')) {
  function rate_limit_soft(PDO $pdo, $action, $limit = 30, $windowSec = 60) {
    // session/IP based soft limiter + DB log (optional)
    if (session_status() === PHP_SESSION_NONE) session_start();
    $now = time();
    $key = 'rl_' . $action;
    if (empty($_SESSION[$key])) $_SESSION[$key] = ['start'=>$now, 'count'=>0];
    $bucket = &$_SESSION[$key];
    if (($now - $bucket['start']) > $windowSec) { $bucket = ['start'=>$now, 'count'=>0]; }
    $bucket['count']++;
    // log to DB asynchronously best-effort
    try {
      $uid = intval($_SESSION['user_id'] ?? 0);
      $ip  = $_SERVER['REMOTE_ADDR'] ?? '';
      $stmt = $pdo->prepare("INSERT INTO rate_events (user_id, ip, action) VALUES (?, ?, ?)");
      $stmt->execute([$uid, $ip, $action]);
    } catch (Throwable $e) {}
    if ($bucket['count'] > $limit) {
      header('Retry-After: '.intval($windowSec));
      return false; // caller may decide to block
    }
    return true;
  }
}
?>
