<?php
/**
 * كلاس المصادقة: تسجيل دخول، تسجيل حساب، فحص الصلاحيات، تسجيل خروج
 * (يعتمد على الجلسة $_SESSION['user'])
 */
class Auth
{
    /* =================================================================
     * تسجيل الدخول والحساب
     * ================================================================= */

    /** محاولة تسجيل دخول: يرجّع true لو الإيميل والباسورد صح */
    public static function attempt(string $email, string $password): bool
    {
        $st = Database::connect()->prepare(
            'SELECT id, name, password_hash, role, profile_image
             FROM users
             WHERE email = ?
             LIMIT 1'
        );
        $st->execute([$email]);
        $u = $st->fetch();

        // نفس الرد لو الإيميل مش موجود أو الباسورد غلط
        if (!$u || !password_verify($password, $u['password_hash'])) {
            return false;
        }

        session_regenerate_id(true); // منع Session Fixation

        // نخزن بالجلسة بيانات المستخدم بدون الباسورد
        $_SESSION['user'] = [
            'id'            => (int)$u['id'],
            'name'          => $u['name'],
            'role'          => $u['role'],
            'profile_image' => $u['profile_image'] ?? null,
        ];
        return true;
    }

    /** إنشاء حساب جديد (دايماً بدور customer) */
    public static function register(string $name, string $email, string $password): void
    {
        Database::connect()
            ->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,"customer")')
            ->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT)]);
    }

    /** هل الإيميل مسجل مسبقاً؟ */
    public static function emailExists(string $email): bool
    {
        $st = Database::connect()->prepare('SELECT 1 FROM users WHERE email = ?');
        $st->execute([$email]);
        return (bool)$st->fetchColumn();
    }


    /* =================================================================
     * معلومات المستخدم الحالي
     * ================================================================= */

    /** هل في مستخدم مسجل دخول؟ */
    public static function check(): bool
    {
        return !empty($_SESSION['user']['id']);
    }

    /** بيانات المستخدم من الجلسة (أو null) */
    public static function user(): ?array
    {
        return $_SESSION['user'] ?? null;
    }

    /** رقم المستخدم (0 لو مش مسجل) */
    public static function id(): int
    {
        return (int)($_SESSION['user']['id'] ?? 0);
    }

    /** يتحقق من الدور مباشرة من قاعدة البيانات (لا نثق بقيمة الجلسة وحدها) */
    public static function isAdmin(): bool
    {
        if (!self::check()) {
            return false;
        }
        $st = Database::connect()->prepare('SELECT role FROM users WHERE id = ?');
        $st->execute([self::id()]);
        return $st->fetchColumn() === 'admin';
    }


    /* =================================================================
     * حماية الصفحات والخروج
     * ================================================================= */

    /** للصفحات العادية: لو مش مسجل دخول بنحوله على صفحة الدخول */
    public static function requireLogin(): void
    {
        if (!self::check()) {
            flash('error', 'يرجى تسجيل الدخول أولاً.');
            redirect('login.php');
        }
    }

    /** تسجيل الخروج: نمسح الجلسة والكوكي */
    public static function logout(): void
    {
        $_SESSION = [];

        // حذف كوكي الجلسة من المتصفح
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
        }
        session_destroy();
    }
}