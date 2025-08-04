<?php
session_start();

// Deny access if user is not logged in or not an admin
if (!isset($_SESSION['user_id']) || ($_SESSION['role'] ?? '') !== 'admin') {
    // Optional: log unauthorized access attempt
    // error_log("Unauthorized access attempt by IP: " . $_SERVER['REMOTE_ADDR']);

    header('Location: ../login.html');
    exit;
}
