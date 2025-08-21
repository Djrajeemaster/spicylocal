<?php
// bagit/admin/_header_injector.php
// Auto-prepend script that injects global header snippet after the first <body> tag
// into any admin page without editing individual files.

// Do not run for APIs or pure PHP includes (no HTML output likely)
$script = isset($_SERVER['SCRIPT_NAME']) ? strtolower($_SERVER['SCRIPT_NAME']) : '';
if (strpos($script, '/api/') !== false || substr($script, -4) !== '.php') {
    return;
}

// Start output buffering with a callback that injects the snippet
ob_start(function($buffer) {
    // Quick guard: only process if we see a <body> tag
    if (stripos($buffer, '<body') === false) {
        return $buffer;
    }

    $snippet = "\n" . '<div id="global-header"></div>' . "\n"
             . '<script src="/bagit/loadHeader.js?v=2025-08-20-7" defer></script>' . "\n";

    // Inject the snippet immediately after the opening <body> tag
    $buffer = preg_replace(
        '/(<body\b[^>]*>)/i',
        "$1" . $snippet,
        $buffer,
        1 // only first match
    );
    return $buffer;
});
