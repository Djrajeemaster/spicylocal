<?php
require_once __DIR__ . '/_security.php';
require_once __DIR__ . '/_bootstrap.php';
header('Content-Type: application/json');
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth_check_user.php';
try {
  $input = json_decode(file_get_contents('php://input'), true);
  $deal_id = intval($input['deal_id'] ?? 0);
  $value = $input['value'] ?? null; // 'up' | 'down'
  if (!$deal_id || !in_array($value, ['up','down'], true)) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Invalid payload']); exit; }
  $user_id = intval($currentUserId);
  $pdo->prepare("DELETE FROM votes WHERE deal_id=? AND user_id=?")->execute([$deal_id, $user_id]);
  $pdo->prepare("INSERT INTO votes (deal_id, user_id, vote_type, created_at) VALUES (?, ?, ?, NOW())")->execute([$deal_id,$user_id,$value]);
  $pdo->prepare("UPDATE deals SET upvotes=(SELECT COUNT(*) FROM votes WHERE deal_id=? AND vote_type='up'), downvotes=(SELECT COUNT(*) FROM votes WHERE deal_id=? AND vote_type='down') WHERE id=?")->execute([$deal_id,$deal_id,$deal_id]);
  $st=$pdo->prepare("SELECT upvotes,downvotes,reports FROM deals WHERE id=?"); $st->execute([$deal_id]); $row=$st->fetch(PDO::FETCH_ASSOC);
  echo json_encode(['ok'=>true,'deal_id'=>$deal_id,'counts'=>$row]);
} catch (Throwable $e) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'Server error','detail'=>$e->getMessage()]); }

// Soft security guards
if (!rate_limit_soft($pdo, 'vote', 30, 60)) { http_response_code(429); echo json_encode(['ok'=>false,'error'=>'rate_limited']); exit; }
/* CSRF soft-check (not breaking old clients) */ if ($_SERVER['REQUEST_METHOD']==='POST') { check_csrf_soft(); }
