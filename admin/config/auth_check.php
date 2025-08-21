<?php
session_start();

/*
 * Access control for the admin area.
 *
 * Historically this check only allowed users with the exact role of "admin" to
 * access any page that included this file. However, the platform now
 * distinguishes between several privileged roles – specifically "admin" and
 * "super_admin". A super admin should have access to all administrative
 * interfaces, including user management, moderation and feature toggles.
 *
 * If the currently authenticated user does not belong to one of the allowed
 * roles we redirect them back to the main login screen. We also ensure that
 * a session exists so that anonymous visitors are not granted access.
 */
// List of roles that are permitted to access admin pages. Moderators have a
// separate dashboard and therefore are intentionally excluded here.
$allowedRoles = ['admin', 'super_admin'];

if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role'] ?? '', $allowedRoles, true)) {
    // Optional: log unauthorized access attempt
    // error_log("Unauthorized access attempt by IP: " . $_SERVER['REMOTE_ADDR']);

    // Use a relative path to the unified login page rather than login.html to
    // ensure consistent redirects across the app. login.php manages
    // role-based sessions and localStorage updates on successful login.
    header('Location: /bagit/login.php');
    exit;
}
