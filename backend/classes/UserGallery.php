<?php

class UserGallery
{
    /** كل صور مستخدم معيّن (الأحدث أولاً) */
    public static function allForUser(int $userId): array
    {
        $st = Database::connect()->prepare(
            'SELECT id, image_path, created_at
             FROM user_images
             WHERE user_id = ?
             ORDER BY id DESC'
        );
        $st->execute([$userId]);
        return $st->fetchAll();
    }

    /** رفع صورة جديدة للمستخدم وحفظها بالداتابيس */
    public static function add(int $userId, array $file): array
    {
        // أول شي نحفظ الملف على السيرفر
        $path = ImageUploader::save($file, 'users');

        try {
            $db = Database::connect();
            $st = $db->prepare('INSERT INTO user_images (user_id, image_path) VALUES (?,?)');
            $st->execute([$userId, $path]);

            return [
                'id'         => (int)$db->lastInsertId(),
                'image_path' => $path,
                'created_at' => date('Y-m-d H:i:s'),
            ];
        } catch (Throwable $e) {
            // فشل الحفظ بالداتابيس: نحذف الملف عشان ما يضل ملف يتيم
            ImageUploader::delete($path);
            throw $e;
        }
    }

    /** كل صور كل المستخدمين مع اسم وإيميل صاحب الصورة (للأدمن) */
    public static function allForAdmin(): array
    {
        return Database::connect()->query(
            'SELECT i.id, i.user_id, i.image_path, i.created_at, u.name, u.email
             FROM user_images i
             INNER JOIN users u ON u.id = i.user_id
             ORDER BY i.id DESC'
        )->fetchAll();
    }
}