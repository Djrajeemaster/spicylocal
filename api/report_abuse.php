<?php
// report_abuse.php — v7: matches abuse_reports table exactly (id, deal_id, reported_by, reason, created_at)
@header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) { @session_start(); }
require_once __DIR__ . '/config/db.php';

function respond($ok, $data=[]) {
  echo json_encode(array_merge(['ok'=>$ok], $data), JSON_UNESCAPED_UNICODE);
  exit;
}

try {
  // Parse input
  $raw = file_get_contents('php://input');
  $in = json_decode($raw ?: '[]', true);
  if (!is_array($in)) $in = [];
  foreach ($_POST as $k => $v) { $in[$k] = $v; }

  $deal_id = intval($in['deal_id'] ?? $in['dealId'] ?? 0);
  $reason  = trim((string)($in['reason'] ?? $in['note'] ?? $in['text'] ?? ''));
  $reported_by = isset($_SESSION['username']) ? trim((string)$_SESSION['username']) : '';

  if ($deal_id <= 0 || $reason === '') {
    http_response_code(400);
    respond(false, ['error'=>'Invalid payload']);
  }
  if ($reported_by === '') {
    http_response_code(401);
    respond(false, ['error'=>'Unauthorized','code'=>'not_logged_in']);
  }

  // Truncate to DB-safe lengths
  if (strlen($reason) > 255) $reason = substr($reason, 0, 255);
  if (strlen($reported_by) > 128) $reported_by = substr($reported_by, 0, 128);

  // One report per (deal_id, reported_by)
  $pdo->beginTransaction();
  $pdo->prepare("DELETE FROM abuse_reports WHERE deal_id=? AND reported_by=?")
      ->execute([$deal_id, $reported_by]);
  $pdo->prepare("INSERT INTO abuse_reports (deal_id, reported_by, reason, created_at) VALUES (?, ?, ?, NOW())")
      ->execute([$deal_id, $reported_by, $reason]);
  $pdo->commit();

  // Update deals.reports if column exists
  try {
    $pdo->prepare("UPDATE deals d SET reports=(SELECT COUNT(*) FROM abuse_reports ar WHERE ar.deal_id=d.id) WHERE d.id=?")
        ->execute([$deal_id]);
  } catch (Throwable $e) {
    // ignore if column doesn't exist
  }

  // Fetch updated counts if possible
  $counts = ['upvotes'=>0,'downvotes'=>0,'reports'=>0];
  try {
    $st = $pdo->prepare("SELECT upvotes, downvotes, reports FROM deals WHERE id=? LIMIT 1");
    $st->execute([$deal_id]);
    if ($row = $st->fetch(PDO::FETCH_ASSOC)) {
      $counts = $row;
    }
  } catch (Throwable $e) {
    // ignore if columns missing
  }

  respond(true, ['deal_id'=>$deal_id,'counts'=>$counts]);
} catch (Throwable $e) {
  if (isset($pdo) && $pdo->inTransaction()) { $pdo->rollBack(); }
  http_response_code(500);
  respond(false, ['error'=>'Server error','detail'=>$e->getMessage()]);
}
