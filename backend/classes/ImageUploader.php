<?php
/**
 * رفع صور آمن: يتحقق من النوع الحقيقي والحجم ويحفظ باسم عشوائي فريد
 */
class ImageUploader
{
    // الأنواع المسموحة (النوع الحقيقي => الامتداد)
    private const ALLOWED = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];

    // المجلدات المسموحة داخل uploads/
    private const FOLDERS = ['products', 'categories', 'users'];


    /* =================================================================
     * حفظ الصورة
     * ================================================================= */

    /** @return string المسار النسبي المخزَّن في قاعدة البيانات */
    public static function save(array $file, string $folder): string
    {
        // 1) المجلد لازم يكون من القائمة المسموحة
        if (!in_array($folder, self::FOLDERS, true)) {
            throw new RuntimeException('مجلد غير صالح.');
        }

        // 2) فحص أخطاء الرفع من PHP
        switch ($file['error'] ?? UPLOAD_ERR_NO_FILE) {
            case UPLOAD_ERR_OK:
                break;
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                throw new RuntimeException('حجم الصورة أكبر من المسموح (2MB).');
            default:
                throw new RuntimeException('فشل رفع الصورة، حاول مرة أخرى.');
        }

        // 3) نتأكد إنه ملف مرفوع فعلاً عن طريق HTTP، والحجم ضمن الحد
        if (!is_uploaded_file($file['tmp_name'])) {
            throw new RuntimeException('ملف غير صالح.');
        }
        if ($file['size'] > UPLOAD_MAX_BYTES) {
            throw new RuntimeException('حجم الصورة أكبر من 2MB.');
        }

        // 4) النوع الحقيقي من محتوى الملف (وليس من الامتداد أو من المتصفح)
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        if (!isset(self::ALLOWED[$mime]) || @getimagesize($file['tmp_name']) === false) {
            throw new RuntimeException('صيغة غير مدعومة. المسموح: JPG, PNG, WEBP.');
        }

        // 5) ننشئ المجلد إذا مش موجود
        $dir = ROOT_PATH . "/uploads/$folder";
        if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
            throw new RuntimeException('تعذّر إنشاء مجلد الرفع.');
        }

        // 6) اسم عشوائي (32 حرف hex) + امتداد من النوع الحقيقي
        $name = bin2hex(random_bytes(16)) . '.' . self::ALLOWED[$mime];
        if (!move_uploaded_file($file['tmp_name'], "$dir/$name")) {
            throw new RuntimeException('تعذّر حفظ الصورة.');
        }

        return "uploads/$folder/$name";
    }


    /* =================================================================
     * حذف الصورة
     * ================================================================= */

    /** حذف صورة من السيرفر (فقط لو المسار بنفس الشكل اللي بنولّده) */
    public static function delete(?string $path): void
    {
        if (!$path || !preg_match('#^uploads/(products|categories|users)/[a-f0-9]{32}\.(jpg|png|webp)$#', $path)) {
            return;
        }

        $full = ROOT_PATH . '/' . $path;
        if (is_file($full)) {
            @unlink($full);
        }
    }
}