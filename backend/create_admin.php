<?php

// يشتغل من سطر الأوامر فقط (ممنوع من المتصفح)
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('CLI only');
}

require __DIR__ . '/init.php';

// قراءة المدخلات: الاسم، الإيميل، كلمة المرور
[$script, $name, $email, $pass] = $argv + [null, null, null, null];

// التحقق: اسم موجود، إيميل صحيح، باسورد 8 أحرف على الأقل
if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen((string)$pass) < 8) {
    exit("الاستخدام: php create_admin.php \"الاسم\" email \"كلمة_مرور_8+\"\n");
}

// إنشاء الأدمن (الباسورد بينخزن مشفّر)
Database::connect()
    ->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,"admin")')
    ->execute([$name, $email, password_hash($pass, PASSWORD_DEFAULT)]);

echo "تم إنشاء حساب الأدمن. احذف هذا الملف الآن.\n";