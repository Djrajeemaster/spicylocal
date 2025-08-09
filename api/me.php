<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
ini_set('display_errors','0'); ini_set('log_errors','1'); ini_set('error_log', __DIR__.'/php_errors.log');
session_start();
if (empty($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['ok'=>false]); exit; }
echo json_encode(['ok'=>true,'user_id'=>(int)$_SESSION['user_id'],'username'=>($_SESSION['username']??''),'is_admin'=>(int)($_SESSION['is_admin']??0)]);