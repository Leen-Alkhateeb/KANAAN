<?php

class AdminDashboard
{
    public static function statistics(PDO $db): array
    {
        // دالة صغيرة: تنفذ استعلام COUNT وترجّع الرقم
        $count = static fn(string $sql): int => (int)$db->query($sql)->fetchColumn();

        // الطلبات الملغاة ما بتنحسب بالإيرادات
        $notCancelled = "status <> 'Cancelled'";

        return [
            /* ---- أرقام عامة ---- */
            'products'   => $count('SELECT COUNT(*) FROM products'),
            'categories' => $count('SELECT COUNT(*) FROM categories'),
            'orders'     => $count('SELECT COUNT(*) FROM orders'),
            'users'      => $count('SELECT COUNT(*) FROM users'),
            'pending'    => $count("SELECT COUNT(*) FROM orders WHERE status = 'Pending'"), // طلبات قيد الانتظار

            /* ---- إجمالي الإيرادات (بدون الملغي) ---- */
            'revenue' => (float)$db->query(
                "SELECT COALESCE(SUM(total), 0) FROM orders WHERE $notCancelled"
            )->fetchColumn(),

            /* ---- آخر 6 طلبات ---- */
            'recent' => $db->query(
                'SELECT id, full_name, total, status, created_at
                 FROM orders
                 ORDER BY id DESC
                 LIMIT 6'
            )->fetchAll(),

            /* ---- مبيعات كل شهر (للرسم البياني) ---- */
            'monthly' => $db->query(
                "SELECT DATE_FORMAT(created_at, '%Y-%m') month,
                        COALESCE(SUM(total), 0) revenue
                 FROM orders
                 WHERE $notCancelled
                   AND created_at >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
                 GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                 ORDER BY month"
            )->fetchAll(),

            /* ---- منتجات مخزونها قليل (3 أو أقل) ---- */
            'low_stock' => $db->query(
                'SELECT id, name, stock
                 FROM products
                 WHERE stock <= 3
                 ORDER BY stock, id
                 LIMIT 6'
            )->fetchAll(),
        ];
    }
}