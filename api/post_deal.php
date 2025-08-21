<?php
require_once __DIR__ . '/_security.php';
require_once __DIR__ . '/_bootstrap.php';
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
require_once __DIR__ . '/require_login.php';
/**
 * JSON API for posting a new deal. This endpoint accepts a JSON body
 * containing at minimum: title, description, price, location, category,
 * and optionally start_date, end_date, cta_text, cta_url, summary, tags (array).
 * The user must be authenticated; we read the user_id from the session.
 */
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/config/db.php';

// Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
  echo json_encode(['success' => false, 'error' => 'Unauthorized']);
  exit;
}
$userId = $_SESSION['user_id'];

// Check if the user is muted. Muted users cannot post new deals.
try {
  $muteCheck = $pdo->prepare('SELECT is_muted FROM users WHERE id = ?');
  $muteCheck->execute([$userId]);
  $isMuted = (int)$muteCheck->fetchColumn();
  if ($isMuted) {
    echo json_encode(['success' => false, 'error' => 'You are muted and cannot post new deals']);
    exit;
  }
} catch (PDOException $muteEx) {
  echo json_encode(['success' => false, 'error' => 'Error checking user status']);
  exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$title       = trim($data['title'] ?? '');
$description = trim($data['description'] ?? '');
$price       = $data['price'] ?? '';
$location    = trim($data['location'] ?? '');
$category    = trim($data['category'] ?? '');
$start_date  = $data['start_date'] ?? null;
$end_date    = $data['end_date'] ?? null;
$cta_text    = trim($data['cta_text'] ?? '');
$cta_url     = trim($data['cta_url'] ?? '');
$summary     = trim($data['summary'] ?? '');
$tags        = isset($data['tags']) && is_array($data['tags']) ? $data['tags'] : [];

if ($title === '' || $description === '' || $category === '' || $price === '' || $location === '') {
  echo json_encode(['success' => false, 'error' => 'Missing required fields']);
  exit;
}

$pdo->beginTransaction();
try {
  $stmt = $pdo->prepare("INSERT INTO deals (title, description, price, location, category, start_date, end_date, cta_text, cta_url, summary, user_id, status) VALUES (?,?,?,?,?,?,?,?,?,?,?, 'pending')");
  $stmt->execute([$title, $description, $price, $location, $category, $start_date, $end_date, $cta_text, $cta_url, $summary, $userId]);
  $dealId = $pdo->lastInsertId();
  // Insert tags
  if (!empty($tags)) {
    $tagStmt = $pdo->prepare("INSERT INTO deal_tags (deal_id, tag_name) VALUES (?, ?)");
    foreach ($tags as $tag) {
      $clean = trim($tag);
      if ($clean === '') continue;
      $tagStmt->execute([$dealId, $clean]);
    }
  }
  $pdo->commit();
  echo json_encode(['success' => true, 'deal_id' => $dealId]);
} catch (Exception $e) {
  $pdo->rollBack();
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
// Soft security guards
if (!rate_limit_soft($pdo, 'post_deal', 30, 60)) { http_response_code(429); echo json_encode(['ok'=>false,'error'=>'rate_limited']); exit; }
/* CSRF soft-check (not breaking old clients) */ if ($_SERVER['REQUEST_METHOD']==='POST') { check_csrf_soft(); }
