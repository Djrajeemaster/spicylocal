<?php

// === Upload hardening ===
$allowed = ['image/jpeg','image/png','image/webp'];
if (!empty($_FILES['image']['tmp_name'])) {
  $finfo = finfo_open(FILEINFO_MIME_TYPE);
  $mime  = finfo_file($finfo, $_FILES['image']['tmp_name']);
  finfo_close($finfo);
  if (!in_array($mime, $allowed, true)) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'invalid_file_type']); exit; }
  // Normalize extension
  $ext = ($mime==='image/png'?'png':($mime==='image/webp'?'webp':'jpg'));
  $safeName = 'deal_' . time() . '_' . mt_rand(1000,9999) . '.' . $ext;
  $_FILES['image']['name'] = $safeName;
}

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
require_once __DIR__ . '/require_login.php';
/**
 * Updates the logged‑in user's business profile. Expects a multipart form
 * POST request containing optional fields:
 *  - logo (file upload)
 *  - about (text)
 *  - social (text, e.g. JSON or comma‑separated links)
 *
 * Only verified business users are allowed to update their profile. The
 * uploaded logo will be saved in the 'uploads/business_logos/' folder. The
 * users table should include columns business_logo, business_about,
 * business_social for storing these values.
 */
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

if (!isset($_SESSION['user_id'])) {
  echo json_encode(['success' => false, 'error' => 'Not logged in']);
  exit;
}
$userId = $_SESSION['user_id'];

// Check if user is verified business
$checkStmt = $pdo->prepare("SELECT is_verified_business FROM users WHERE id = ? LIMIT 1");
$checkStmt->execute([$userId]);
$row = $checkStmt->fetch(PDO::FETCH_ASSOC);
if (!$row || (int)$row['is_verified_business'] !== 1) {
  echo json_encode(['success' => false, 'error' => 'Not a verified business']);
  exit;
}

$about = isset($_POST['about']) ? trim($_POST['about']) : '';
$social = isset($_POST['social']) ? trim($_POST['social']) : '';
$logoPath = null;

// Handle logo upload if provided
if (isset($_FILES['logo']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
  $uploadDir = __DIR__ . '/../uploads/business_logos/';
  if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
  }
  $ext = pathinfo($_FILES['logo']['name'], PATHINFO_EXTENSION);
  $fileName = 'logo_' . $userId . '_' . time() . '.' . $ext;
  $target = $uploadDir . $fileName;
  if (move_uploaded_file($_FILES['logo']['tmp_name'], $target)) {
    $logoPath = 'uploads/business_logos/' . $fileName;
  }
}

// Build SQL update query dynamically
$fields = [];
$params = [];
if ($about !== '') {
  $fields[] = 'business_about = ?';
  $params[] = $about;
}
if ($social !== '') {
  $fields[] = 'business_social = ?';
  $params[] = $social;
}
if ($logoPath) {
  $fields[] = 'business_logo = ?';
  $params[] = $logoPath;
}
if (empty($fields)) {
  echo json_encode(['success' => false, 'error' => 'No data to update']);
  exit;
}
// Append user id param
$params[] = $userId;

$sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?';
try {
  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);
  echo json_encode(['success' => true, 'message' => 'Profile updated']);
} catch (Exception $e) {
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>