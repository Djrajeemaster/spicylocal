<?php
// Basic category prediction for SpicyBeats deals
// Accepts JSON payload with `title` and `description` fields
// and returns a list of suggested categories based on simple keyword matching.
// This avoids external API calls and meets the Suggestion Protocol v1.0.

header('Content-Type: application/json');
$input = json_decode(file_get_contents('php://input'), true);
$title = strtolower($input['title'] ?? '');
$description = strtolower($input['description'] ?? '');
$text = $title . ' ' . $description;

// Define simple keyword mapping to categories
$categoryMap = [
    'electronics' => ['phone','iphone','laptop','tv','computer','electronics','tablet','camera'],
    'grocery'     => ['grocery','food','supermarket','vegetable','fruit','milk','bread','kitchen'],
    'clothing'    => ['clothing','clothes','shirt','pant','shoe','fashion','apparel','dress','jeans'],
    'entertainment' => ['movie','cinema','concert','music','entertainment','event','ticket','show'],
    'travel'      => ['flight','hotel','travel','tour','trip','vacation','journey','tourism'],
    'beauty'      => ['beauty','cosmetic','makeup','skincare','salon','spa','hair'],
    'sport'       => ['sport','fitness','gym','exercise','running','football','basketball'],
    'home'        => ['furniture','home','decor','sofa','bed','table','chair','lamp'],
    'kids'        => ['toy','kids','children','baby','infant','child'],
    'local'       => ['local','restaurant','cafe','bar','shop','store'],
    'online'      => ['online','web','website','app','digital'],
    'weekend'     => ['weekend','saturday','sunday'],
    'flash-sale'  => ['flash','sale','limited','discount','deal'],
    'other'       => []
];

$matched = [];
foreach ($categoryMap as $category => $keywords) {
    if ($category === 'other') continue;
    foreach ($keywords as $kw) {
        if (strpos($text, $kw) !== false) {
            $matched[] = $category;
            break;
        }
    }
}
if (empty($matched)) {
    $matched[] = 'other';
}

echo json_encode(['categories' => array_values(array_unique($matched))]);
?>