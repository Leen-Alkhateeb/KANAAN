<?php
/**
 * سلة المشتريات المخزّنة في الجلسة: [product_id => quantity]
 */
class Cart
{
    /* =================================================================
     * التعديل على السلة
     * ================================================================= */

    /** إضافة منتج للسلة (بدون ما نتجاوز المخزون). يرجّع false لو المنتج مش متوفر */
    public static function add(int $id, int $qty = 1): bool
    {
        $st = Database::connect()->prepare('SELECT stock FROM products WHERE id = ?');
        $st->execute([$id]);
        $stock = $st->fetchColumn();

        // المنتج مش موجود أو المخزون صفر
        if ($stock === false || (int)$stock < 1) {
            return false;
        }

        // الكمية الجديدة = القديمة + المطلوبة (على الأقل 1)، وما تزيد عن المخزون
        $cur = $_SESSION['cart'][$id] ?? 0;
        $_SESSION['cart'][$id] = min($cur + max(1, $qty), (int)$stock);
        return true;
    }

    /** تغيير الكمية (صفر أو أقل = حذف المنتج، والحد الأقصى 99) */
    public static function update(int $id, int $qty): void
    {
        if ($qty <= 0) {
            self::remove($id);
            return;
        }
        if (isset($_SESSION['cart'][$id])) {
            $_SESSION['cart'][$id] = min($qty, 99);
        }
    }

    /** حذف منتج من السلة */
    public static function remove(int $id): void
    {
        unset($_SESSION['cart'][$id]);
    }

    /** تفريغ السلة بالكامل */
    public static function clear(): void
    {
        unset($_SESSION['cart']);
    }


    /* =================================================================
     * قراءة السلة
     * ================================================================= */

    /** مجموع عدد القطع بالسلة */
    public static function count(): int
    {
        return array_sum($_SESSION['cart'] ?? []);
    }

    /** عناصر السلة مع الأسعار الحقيقية من قاعدة البيانات (مش من الجلسة) */
    public static function items(): array
    {
        $cart = $_SESSION['cart'] ?? [];
        if (!$cart) {
            return [];
        }

        $ids = array_keys($cart);
        $in  = implode(',', array_fill(0, count($ids), '?'));
        $st  = Database::connect()->prepare("SELECT id, name, price, stock, image FROM products WHERE id IN ($in)");
        $st->execute($ids);

        $items = [];
        foreach ($st->fetchAll() as $p) {
            // الكمية ما تتجاوز المخزون الحالي
            $qty = min((int)$cart[$p['id']], (int)$p['stock']);

            // نفد المخزون: نشيله من السلة
            if ($qty < 1) {
                self::remove((int)$p['id']);
                continue;
            }

            $p['qty']      = $qty;
            $p['subtotal'] = $qty * (float)$p['price'];
            $items[]       = $p;
        }
        return $items;
    }

    /** مجموع سعر العناصر */
    public static function total(array $items): float
    {
        return array_sum(array_column($items, 'subtotal'));
    }
}