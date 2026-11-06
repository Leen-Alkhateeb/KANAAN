<?php
/** الاتصال بقاعدة البيانات عبر PDO (Singleton) مع معالجة الأخطاء */
class Database
{
    // إعدادات الاتصال (عدّلها حسب السيرفر)
    private const HOST = 'localhost';
    private const NAME = 'kanaan_db';
    private const USER = 'root';
    private const PASS = '';
    private const CHARSET = 'utf8mb4';

    // اتصال واحد بس يُستخدم بكل الطلب (Singleton)
    private static ?PDO $pdo = null;

    public static function connect(): PDO
    {
        // نفتح الاتصال أول مرة بس، وبعدها نرجّع نفس الاتصال
        if (self::$pdo === null) {
            $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', self::HOST, self::NAME, self::CHARSET);
            try {
                self::$pdo = new PDO($dsn, self::USER, self::PASS, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,   // الأخطاء كـ Exceptions
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,         // النتائج كـ array بأسماء الأعمدة
                    PDO::ATTR_EMULATE_PREPARES   => false,                    // prepared statements حقيقية
                ]);
            } catch (PDOException $e) {
                error_log('[KANAAN-DB] ' . $e->getMessage());   // التفاصيل في السجل فقط
                http_response_code(500);
                exit('تعذّر الاتصال بقاعدة البيانات، يرجى المحاولة لاحقاً.');   // رسالة عامة للمستخدم
            }
        }
        return self::$pdo;
    }
}