
<?php
session_start();
require_once 'config/db.php';

if (!isset($_SESSION['user_id'])) {
    die('Unauthorized');
}

// Prevent muted users from posting deals
$currentUserId = $_SESSION['user_id'];
$muteCheckStmt = $pdo->prepare('SELECT is_muted FROM users WHERE id = ?');
$muteCheckStmt->execute([$currentUserId]);
$isMuted = $muteCheckStmt->fetchColumn();
if ($isMuted) {
    // Handle AJAX and non-AJAX cases
    $isAjaxReq = !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
    if ($isAjaxReq) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => 'You are muted and cannot post deals.']);
        exit;
    }
    echo "<script>alert('You are muted and cannot post deals.'); window.location='index.html';</script>";
    exit;
}

$title = $_POST['title'] ?? '';
$desc = $_POST['description'] ?? '';
$price = $_POST['price'] ?? '';
$loc = $_POST['location'] ?? '';
$cat = $_POST['category'] ?? '';
// New fields: start date, end date, CTA text, CTA URL, summary and tags
$start_date = $_POST['start_date'] ?? '';
$end_date   = $_POST['end_date'] ?? '';
$cta_text   = $_POST['cta_text'] ?? '';
$cta_url    = $_POST['cta_url'] ?? '';
$summary    = $_POST['summary'] ?? '';
$tags       = isset($_POST['tags']) && is_array($_POST['tags']) ? $_POST['tags'] : [];

$user_id = $_SESSION['user_id'];
$upload_dir = 'uploads/';
$default_image = 'uploads/default.jpg';

$pdo->beginTransaction();
try {
$stmt = $pdo->prepare("INSERT INTO deals (title, description, price, location, category, start_date, end_date, cta_text, cta_url, summary, user_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')");
$stmt->execute([$title, $desc, $price, $loc, $cat, $start_date, $end_date, $cta_text, $cta_url, $summary, $user_id]);
    $deal_id = $pdo->lastInsertId();

    $maxImages = 5;
    foreach ($_FILES['images']['tmp_name'] as $i => $tmpName) {
        if ($i >= $maxImages) break;
        if ($_FILES['images']['error'][$i] !== UPLOAD_ERR_OK) continue;

        $filename = "deal_{$deal_id}_" . time() . "_{$i}.jpg";
        $target = $upload_dir . $filename;

        list($w, $h) = getimagesize($tmpName);
        $src = imagecreatefromstring(file_get_contents($tmpName));
        $dst = imagecreatetruecolor(800, 600);
        imagecopyresampled($dst, $src, 0, 0, 0, 0, 800, 600, $w, $h);
        imagejpeg($dst, $target, 70);

        $thumb = $upload_dir . "thumb_" . $filename;
        $thumb_dst = imagecreatetruecolor(300, 200);
        imagecopyresampled($thumb_dst, $src, 0, 0, 0, 0, 300, 200, $w, $h);
        imagejpeg($thumb_dst, $thumb, 60);

        $stmt2 = $pdo->prepare("INSERT INTO deal_images (deal_id, image_path) VALUES (?, ?)");
        $stmt2->execute([$deal_id, $filename]);
    }
    // Save tags into deal_tags table
    if (!empty($tags)) {
        $stmtTags = $pdo->prepare("INSERT INTO deal_tags (deal_id, tag_name) VALUES (?, ?)");
        foreach ($tags as $tag) {
            $cleanTag = trim($tag);
            if ($cleanTag === '') continue;
            $stmtTags->execute([$deal_id, $cleanTag]);
        }
    }
    $pdo->commit();
    // Determine if request is an AJAX call (used by front-end to show SweetAlert)
    $isAjax = false;
    if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
        $isAjax = true;
    }
    if ($isAjax) {
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'deal_id' => $deal_id]);
    } else {
        echo "<script>alert('Deal submitted successfully!'); window.location='index.html';</script>";
    }
    exit;
} catch (Exception $e) {
    $pdo->rollBack();
    $isAjaxErr = !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
    if ($isAjaxErr) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        exit;
    }
    die("Error: " . $e->getMessage());
}
?>
