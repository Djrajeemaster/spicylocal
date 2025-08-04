<?php
require_once "config/db.php";
$id = $_GET['id'] ?? 0;
if (!$id) die("Invalid ID");

$stmt = $pdo->prepare("DELETE FROM deals WHERE id = ?");
$stmt->execute([$id]);
header("Location: dashboard.php");
?>