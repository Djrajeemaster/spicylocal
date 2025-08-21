<?php
// Simple AI summary generator for SpicyBeats
// This endpoint accepts a JSON payload with a `description` field
// and returns a one‑line summary based on the first few words of the description.
// We avoid external API calls for compliance with the Suggestion Protocol v1.0.
// If description is too short or missing, the summary will be empty.

header('Content-Type: application/json');
// Read incoming JSON
$input = json_decode(file_get_contents('php://input'), true);
$description = isset($input['description']) ? $input['description'] : '';

// Sanitize and strip tags
$plain = strip_tags($description);
$plain = preg_replace('/\s+/', ' ', $plain);

// Generate summary by taking the first 15 words
$summary = '';
if (!empty($plain)) {
    $words = explode(' ', trim($plain));
    if (count($words) > 15) {
        $summary = implode(' ', array_slice($words, 0, 15)) . '...';
    } else {
        $summary = $plain;
    }
}

echo json_encode(['summary' => $summary]);
?>