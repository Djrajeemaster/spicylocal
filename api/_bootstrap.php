<?php
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', '0');
ini_set('log_errors', '1');
if (session_status() === PHP_SESSION_NONE) { session_start(); }

function json_ok($data = []) { if (is_array($data)) $data['ok'] = $data['ok'] ?? true; echo json_encode($data); exit; }
function json_err($msg='error', $code=400, $extra=[]) { http_response_code($code); echo json_encode(array_merge(['ok'=>false,'error'=>$msg],$extra)); exit; }
function safe_int($v,$min=null,$max=null){ $n=intval($v??0); if($min!==null&&$n<$min)$n=$min; if($max!==null&&$n>$max)$n=$max; return $n; }
function safe_enum($v,$allowed,$def){ return in_array($v,$allowed,true)?$v:$def; }
?>
