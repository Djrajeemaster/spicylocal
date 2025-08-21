<?php
require_once __DIR__ . '/_bootstrap.php';
$cats = [
  ['code'=>'spam', 'label'=>'Spam or misleading'],
  ['code'=>'abusive', 'label'=>'Abusive or harmful'],
  ['code'=>'illegal', 'label'=>'Illegal item/activity'],
  ['code'=>'copyright', 'label'=>'Copyright infringement'],
  ['code'=>'other', 'label'=>'Other'],
];
header('Cache-Control: public, max-age=86400');
echo json_encode(['ok'=>true, 'categories'=>$cats]);
