<?php
// api/_json_headers.php
// Use this at the TOP of JSON endpoints to prevent PHP notices from corrupting JSON.
header('Content-Type: application/json');
ini_set('display_errors', '0');   // don't echo notices/warnings into JSON
ini_set('log_errors', '1');       // log them instead
// optional: set a log file (ensure web server can write it)
// ini_set('error_log', __DIR__ . '/../logs/php_api_errors.log');
?>
