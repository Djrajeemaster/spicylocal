<?php
require_once __DIR__ . '/_bootstrap.php';
require_once __DIR__ . '/_security.php';
echo json_encode(['ok'=>true, 'token'=>csrf_token()]);
