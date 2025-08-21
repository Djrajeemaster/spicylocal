
<?php
require_once 'config/db.php';

$days = 30;
$cutoff = date('Y-m-d H:i:s', strtotime("-{$days} days"));

$sql = "SELECT d.id, di.image_path FROM deals d
        JOIN deal_images di ON d.id = di.deal_id
        WHERE (d.status = 'rejected' OR (d.expiry_date IS NOT NULL AND d.expiry_date < NOW()))
        AND d.updated_at < ?";

$stmt = $pdo->prepare($sql);
$stmt->execute([$cutoff]);
$rows = $stmt->fetchAll();

foreach ($rows as $row) {
    $img = 'uploads/' . $row['image_path'];
    $thumb = 'uploads/thumb_' . $row['image_path'];
    if (file_exists($img)) unlink($img);
    if (file_exists($thumb)) unlink($thumb);
}

$pdo->prepare("DELETE FROM deal_images WHERE deal_id IN (SELECT id FROM deals WHERE status = 'rejected' OR (expiry_date IS NOT NULL AND expiry_date < NOW()))")->execute();
?>
