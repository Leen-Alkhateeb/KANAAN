<?php

class UserProfile
{
    /** بيانات المستخدم (بدون الباسورد). بيرمي خطأ لو الحساب مش موجود */
    public static function find(int $userId): array
    {
        $st = Database::connect()->prepare(
            'SELECT id, name, email, phone, profile_image, created_at
             FROM users
             WHERE id = ?
             LIMIT 1'
        );
        $st->execute([$userId]);
        $user = $st->fetch();

        if (!$user) {
            throw new RuntimeException('الحساب غير موجود.');
        }
        return $user;
    }

    /** تغيير صورة البروفايل: يرجّع المسار الجديد ويحذف الصورة القديمة */
    public static function updateImage(int $userId, array $file): string
    {
        $db = Database::connect();

        // 1) نجيب الصورة القديمة عشان نحذفها بعد نجاح التحديث
        $st = $db->prepare('SELECT profile_image FROM users WHERE id = ?');
        $st->execute([$userId]);
        $old = $st->fetchColumn();

        // 2) نحفظ الصورة الجديدة على السيرفر
        $path = ImageUploader::save($file, 'users');

        try {
            // 3) نحدّث المسار بالداتابيس
            $up = $db->prepare('UPDATE users SET profile_image = ? WHERE id = ?');
            $up->execute([$path, $userId]);

            // rowCount = 0 ممكن يعني إن الحساب مش موجود، فنتأكد
            if ($up->rowCount() === 0) {
                $check = $db->prepare('SELECT id FROM users WHERE id = ?');
                $check->execute([$userId]);
                if (!$check->fetchColumn()) {
                    throw new RuntimeException('الحساب غير موجود.');
                }
            }
        } catch (Throwable $e) {
            // فشل التحديث: نحذف الصورة الجديدة عشان ما يضل ملف يتيم
            ImageUploader::delete($path);
            throw $e;
        }

        // 4) نجح التحديث: نحذف الصورة القديمة من السيرفر
        if ($old && $old !== $path) {
            ImageUploader::delete($old);
        }
        return $path;
    }
}