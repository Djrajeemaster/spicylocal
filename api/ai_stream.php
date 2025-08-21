<?php
// Stream chat from Ollama to the browser
header('Content-Type: text/plain; charset=utf-8');
while (ob_get_level()) { ob_end_flush(); }
ob_implicit_flush(true);
ignore_user_abort(true);
set_time_limit(0);

// -------- CONFIG --------
$model  = $_POST['model'] ?? 'english-fast-7b';   // change to 'spicybeats-7b' if you built that tag
$mode   = $_POST['mode']  ?? 'chat';              // 'chat' (default) or 'te' (translate EN -> Telugu)
$qParam = $_POST['q']     ?? ($_GET['q'] ?? 'Hello');
$msgsJs = $_POST['messages'] ?? null;             // optional: JSON messages[] if you want convo state

// Identity preset (always injected)
$IDENTITY = 'You are spicybeats ai. Your name is "spicybeats ai". '
          . 'If asked your name or who you are, reply exactly: spicybeats ai. '
          . 'Do not say you are an AI or language model. Be concise.';

// Telugu few-shot (helps small models behave)
$FEWSHOT = [
  ['role'=>'user',      'content'=>'నీ పేరు ఏమిటి?'],
  ['role'=>'assistant', 'content'=>'spicybeats ai'],
  ['role'=>'user',      'content'=>'ఒక చిన్న నమస్కారం చెప్పు.'],
  ['role'=>'assistant', 'content'=>'నమస్కారం! మీ రోజు ఆనందంగా సాగాలి.'],
];

// Build messages
$messages = [];
if ($msgsJs) {
  $decoded = json_decode($msgsJs, true);
  if (is_array($decoded)) $messages = $decoded;
}

if (!$messages) {
  // No conversation passed in; build based on mode
  if ($mode === 'te') {
    // Translator mode = most reliable Telugu on small/7B models
    $messages = [
      ['role'=>'system', 'content'=> $IDENTITY . ' Translate English to Telugu. Output ONLY Telugu script. Very short.'],
      ['role'=>'user',   'content'=> $qParam],
    ];
  } else {
    // Normal chat (English by default, but identity is fixed)
    $messages = [
      ['role'=>'system', 'content'=> $IDENTITY . ' Answer in English unless the user explicitly asks for another language.'],
      // add few-shot anchors to steady behavior
      ...$FEWSHOT,
      ['role'=>'user',   'content'=> $qParam],
    ];
  }
} else {
  // Convo provided: ensure system is first and matches our identity
  if (($messages[0]['role'] ?? '') !== 'system') {
    array_unshift($messages, ['role'=>'system','content'=>$IDENTITY]);
  } else {
    $messages[0]['content'] = $IDENTITY;
  }
  if ($mode === 'te') {
    // If caller insists on translator, override system meaningfully
    $messages[0]['content'] .= ' Translate English to Telugu. Output ONLY Telugu script. Very short.';
  }
}

// Decoding/options tuned for stability & speed on local 7B
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
  'stream'   => true,
  'options'  => $options
], JSON_UNESCAPED_UNICODE);

$ch = curl_init('http://127.0.0.1:11434/api/chat');
curl_setopt_array($ch, [
  CURLOPT_POST          => true,
  CURLOPT_HTTPHEADER    => ['Content-Type: application/json'],
  CURLOPT_POSTFIELDS    => $payload,
  CURLOPT_WRITEFUNCTION => function ($ch, $chunk) {
    static $buf = '';
    $buf .= $chunk;
    while (($pos = strpos($buf, "\n")) !== false) {
      $line = substr($buf, 0, $pos);
      $buf  = substr($buf, $pos + 1);
      if ($line === '') continue;
      $j = json_decode($line, true);
      if (isset($j['message']['content'])) { echo $j['message']['content']; flush(); }
      elseif (isset($j['error']))        { echo "ERROR: ".$j['error']; flush(); }
    }
    return strlen($chunk);
  },
  CURLOPT_TIMEOUT       => 0,
]);

curl_exec($ch);
if (curl_errno($ch)) { echo "ERROR: ".curl_error($ch); }
curl_close($ch);
