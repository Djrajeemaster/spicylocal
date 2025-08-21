<?php
header('Content-Type: application/json; charset=utf-8');

$model  = $_POST['model'] ?? 'english-fast-7b';
$mode   = $_POST['mode']  ?? 'chat';
$qParam = $_POST['q']     ?? ($_GET['q'] ?? 'Hello');
$msgsJs = $_POST['messages'] ?? null;

$IDENTITY = 'You are spicybeats ai. Your name is "spicybeats ai". '
          . 'If asked your name or who you are, reply exactly: spicybeats ai. '
          . 'Do not say you are an AI or language model. Be concise.';

$FEWSHOT = [
  ['role'=>'user',      'content'=>'నీ పేరు ఏమిటి?'],
  ['role'=>'assistant', 'content'=>'spicybeats ai'],
  ['role'=>'user',      'content'=>'ఒక చిన్న నమస్కారం చెప్పు.'],
  ['role'=>'assistant', 'content'=>'నమస్కారం! మీ రోజు ఆనందంగా సాగాలి.'],
];

$messages = [];
if ($msgsJs) {
  $decoded = json_decode($msgsJs, true);
  if (is_array($decoded)) $messages = $decoded;
}

if (!$messages) {
  if ($mode === 'te') {
    $messages = [
      ['role'=>'system','content'=> $IDENTITY . ' Translate English to Telugu. Output ONLY Telugu script. Very short.'],
      ['role'=>'user','content'=> $qParam],
    ];
  } else {
    $messages = [
      ['role'=>'system','content'=> $IDENTITY . ' Answer in English unless asked otherwise.'],
      ...$FEWSHOT,
      ['role'=>'user','content'=> $qParam],
    ];
  }
} else {
  if (($messages[0]['role'] ?? '') !== 'system') {
    array_unshift($messages, ['role'=>'system','content'=>$IDENTITY]);
  } else {
    $messages[0]['content'] = $IDENTITY;
  }
  if ($mode === 'te') {
    $messages[0]['content'] .= ' Translate English to Telugu. Output ONLY Telugu script. Very short.';
  }
}

$options = [
  'temperature'    => ($mode === 'te' ? 0.1 : 0.2),
  'top_p'          => 0.9,
  'top_k'          => 40,
  'repeat_penalty' => 1.25,
  'num_predict'    => 120,
  'num_ctx'        => 1024,
  'seed'           => 1,
];

$payload = json_encode([
  'model'    => $model,
  'messages' => $messages,
  'stream'   => false,
  'options'  => $options
], JSON_UNESCAPED_UNICODE);

$ch = curl_init('http://127.0.0.1:11434/api/chat');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
  CURLOPT_POSTFIELDS => $payload,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 120,
]);
$resp = curl_exec($ch);

if ($resp === false) {
  http_response_code(500);
  echo json_encode(['error' => curl_error($ch)]);
} else {
  $j = json_decode($resp, true);
  echo json_encode(['reply' => $j['message']['content'] ?? '']);
}
curl_close($ch);
