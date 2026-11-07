<?php

class ImageUploader
{
    // النوع الحقيقي => الامتداد
    private const TYPES = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
    ];

    private const FOLDERS = ['products', 'categories', 'users'];

    public static function save(array $file, string $folder): string
    {
        // المجلد لازم يكون من المسموح
        if (!in_array($folder, self::FOLDERS, true)) {
            throw new RuntimeException('مجلد غير صالح.');
        }

        // صار خطأ بالرفع، أو الملف مش جاي من HTTP
        if (($file['error'] ?? 4) !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
            throw new RuntimeException('فشل رفع الصورة، حاول مرة أخرى.');
        }

        // الحجم
        if ($file['size'] > UPLOAD_MAX_BYTES) {
            throw new RuntimeException('حجم الصورة أكبر من 2MB.');
        }

        // النوع الحقيقي من محتوى الملف (إذا مش صورة بيرجع false)
        $info = @getimagesize($file['tmp_name']);
        $type = $info['mime'] ?? '';

        if (!isset(self::TYPES[$type])) {
            throw new RuntimeException('صيغة غير مدعومة. المسموح: JPG, PNG, WEBP.');
        }

        // اسم عشوائي + امتداد من النوع الحقيقي
        $name = bin2hex(random_bytes(16)) . '.' . self::TYPES[$type];
        $dir  = ROOT_PATH . '/uploads/' . $folder;

        // أنشئ المجلد إذا مش موجود، وانقل الملف
        if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
            throw new RuntimeException('تعذّر إنشاء مجلد الرفع.');
        }
        if (!move_uploaded_file($file['tmp_name'], "$dir/$name")) {
            throw new RuntimeException('تعذّر حفظ الصورة.');
        }

        return "uploads/$folder/$name";
    }

    public static function delete(?string $path): void
    {
        // احذف بس إذا المسار بنفس الشكل اللي بنولّده إحنا
        $pattern = '#^uploads/(products|categories|users)/[a-f0-9]{32}\.(jpg|png|webp)$#';

        if ($path && preg_match($pattern, $path) && is_file(ROOT_PATH . '/' . $path)) {
            unlink(ROOT_PATH . '/' . $path);
        }
    }
}