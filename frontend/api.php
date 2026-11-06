<?php
/**
 * KANAAN Frontend API bridge.
 * Keeps backend files untouched while allowing frontend pages to call the API.
 * The backend directory denies direct HTTP access via its existing .htaccess;
 * including the API entry point from this frontend endpoint executes it internally.
 */
declare(strict_types=1);
require_once __DIR__ . '/../backend/api/index.php';
