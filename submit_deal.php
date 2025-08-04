
<?php
session_start();
require_once 'config/db.php';

if (!isset($_SESSION['user_id'])) {
    die('Unauthorized');
}

$title = $_POST['title'] ?? '';
$desc = $_POST['description'] ?? '';
$price = $_POST['price'] ?? '';
$loc = $_POST['location'] ?? '';
$cat = $_POST['category'] ?? '';
$user_id = $_SESSION['user_id'];
$upload_dir = 'uploads/';
$default_image = 'uploads/default.jpg';
$allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
$max_file_size = 5 * 1024 * 1024; // 5MB

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare("INSERT INTO deals (title, description, price, location, category, user_id, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')");
    $stmt->execute([$title, $desc, $price, $loc, $cat, $user_id]);
    $deal_id = $pdo->lastInsertId();

    foreach ($_FILES['images']['tmp_name'] as $i => $tmpName) {
        if ($_FILES['images']['error'][$i] !== UPLOAD_ERR_OK) continue;

        if ($_FILES['images']['size'][$i] > $max_file_size) {
            throw new Exception('File too large.');
        }

        $mime = mime_content_type($tmpName);
        if (!in_array($mime, $allowed_types)) {
            throw new Exception('Invalid image type.');
        }

        $imageInfo = getimagesize($tmpName);
        if ($imageInfo === false) {
            throw new Exception('Invalid image file.');
        }

        list($w, $h) = $imageInfo;

        $filename = "deal_{$deal_id}_" . time() . "_{$i}.jpg";
        $target = $upload_dir . $filename;

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
    $pdo->commit();
    echo "<script>alert('Deal submitted successfully!'); window.location='index.html';</script>";
} catch (Exception $e) {
    $pdo->rollBack();
    echo "<script>alert('" . addslashes($e->getMessage()) . "'); window.history.back();</script>";
}
?>
