<?php
header('Content-Type: application/json');
$path = __DIR__ . '/../data/theme.json';
if (!file_exists(dirname($path))) { mkdir(dirname($path), 0777, true); }
if (file_exists($path)) {
  echo file_get_contents($path);
} else {
  echo json_encode(['color' => '#ff007a']);
}
