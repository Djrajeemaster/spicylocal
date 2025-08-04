# SpicyBeats Events

This project is a simple PHP demo for submitting and voting on deals.

## Setup

Create a MySQL database using `config/spicybeats_schema.sql`. The application
reads its connection credentials from environment variables. At a minimum,
`DB_NAME`, `DB_USER`, and `DB_PASS` must be set. `DB_HOST` and `DB_CHARSET`
are optional and default to `localhost` and `utf8mb4` respectively.

```
export DB_HOST=localhost
export DB_NAME=your_database
export DB_USER=your_user
export DB_PASS=your_pass
export DB_CHARSET=utf8mb4
export ADMIN_EMAIL=admin@example.com
```

If any required variables are missing the application will exit with an
error. Run the PHP files through a local server of your choice.

## Authentication

Users can register at `register.php` (or `signup.php`) and log in via
`login.php`. A `logout.php` script is provided to end the session.
