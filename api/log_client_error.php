<?php
require_once __DIR__ . '/_bootstrap.php';
try {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'method']); exit; }
  $raw = file_get_contents('php://input');
  if (!$raw || strlen($raw) > 16384) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'payload']); exit; }
  $in = json_decode($raw, true);
  if (!is_array($in)) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'json']); exit; }
  if (session_status() === PHP_SESSION_NONE) session_start();
  $uid = intval($_SESSION['user_id'] ?? 0);
  $logDir = __DIR__ . '/../logs';
  if (!is_dir($logDir)) @mkdir($logDir, 0775, true);
  $line = json_encode([
    'ts' => time(),
    'uid'=> $uid,
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
    'ua' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 300),
    'type' => $in['type'] ?? 'error',
    'url' => $in['url'] ?? '',
    'payload' => $in['payload'] ?? null
  ], JSON_UNESCAPED_SLASHES);
  @file_put_contents($logDir . '/client_errors.log', $line . PHP_EOL, FILE_APPEND);
  echo json_encode(['ok'=>true]);
} catch (Throwable $e) {
  http_response_code(500); echo json_encode(['ok'=>false,'error'=>'server']);
}
