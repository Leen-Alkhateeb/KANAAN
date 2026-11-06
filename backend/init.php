<?php
/** نقطة الدخول المشتركة: تُضمَّن في أول كل صفحة (متجر + أدمن) */
define('BASE_URL', '/kanaan');                 // غيّرها حسب مسار مشروعك (أو '' إن كان في جذر السيرفر)
define('ROOT_PATH', dirname(__DIR__));
define('UPLOAD_MAX_BYTES', 2 * 1024 * 1024);   // 2MB

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0, 'path' => '/',
        'httponly' => true, 'samesite' => 'Lax',
        'secure'   => !empty($_SERVER['HTTPS']),
    ]);
    session_start();
}

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/classes/Auth.php';
require_once __DIR__ . '/classes/Cart.php';
require_once __DIR__ . '/classes/ImageUploader.php';
require_once __DIR__ . '/classes/UserProfile.php';
require_once __DIR__ . '/classes/AdminDashboard.php';
require_once __DIR__ . '/classes/UserGallery.php';