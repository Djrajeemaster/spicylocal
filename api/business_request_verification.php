<?php
require_once __DIR__ . '/_bootstrap.php';
require_once __DIR__ . '/_security.php';
require_csrf();
if (!isset($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'auth']); exit; }
$in = json_decode(file_get_contents('php://input'), true) ?: [];
$biz = trim($in['business_name'] ?? '');
$site = trim($in['website'] ?? '');
$email= trim($in['contact_email'] ?? '');
if ($biz==='') { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'missing_business_name']); exit; }
$uid = intval($_SESSION['user_id']);
$st = $pdo->prepare("INSERT INTO business_profiles (user_id, business_name, website, contact_email) VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE business_name=VALUES(business_name), website=VALUES(website), contact_email=VALUES(contact_email)");
$st->execute([$uid, $biz, $site, $email]);
echo json_encode(['ok'=>true]);
