# SpicyBeats Events

This project is a simple PHP demo for submitting and voting on deals.

## Setup

Create a MySQL database using `config/spicybeats_schema.sql` and provide the
connection credentials via environment variables:

```
export DB_HOST=localhost
export DB_NAME=your_database
export DB_USER=your_user
export DB_PASS=your_pass
export ADMIN_EMAIL=admin@example.com
```

Run the PHP files through a local server of your choice.

## Authentication

Users can register at `register.php` (or `signup.php`) and log in via
`login.php`. A `logout.php` script is provided to end the session.
