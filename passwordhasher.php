<?php
// Password to be hashed
$password = 'admin2';

// Generate the hashed password
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Output the hashed password
echo $hashedPassword;
?>
