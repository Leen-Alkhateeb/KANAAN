<?php

class Cart
{
    // إضافة منتج للسلة. بترجّع true لو انضاف، و false لو المنتج مش موجود أو خلص
    public static function add(int $productId, int $quantity = 1): bool
    {
        // 1) نجيب المخزون من قاعدة البيانات
        $stmt = Database::connect()->prepare('SELECT stock FROM products WHERE id = ?');
        $stmt->execute([$productId]);
        $stock = $stmt->fetchColumn();

        // 2) لو المنتج مش موجود أو المخزون صفر، ما نضيف
        if ($stock === false || $stock < 1) {
            return false;
        }

        // 3) الكمية اللي بالسلة حالياً (صفر لو المنتج مش موجود فيها)
        $currentQuantity = 0;
        if (isset($_SESSION['cart'][$productId])) {
            $currentQuantity = $_SESSION['cart'][$productId];
        }

        // 4) نحسب الكمية الجديدة
        if ($quantity < 1) {
            $quantity = 1; // أقل كمية مسموحة 1
        }
        $newQuantity = $currentQuantity + $quantity;

        // 5) ما نخلي الكمية تزيد عن المخزون
        if ($newQuantity > $stock) {
            $newQuantity = $stock;
        }

        $_SESSION['cart'][$productId] = $newQuantity;
        return true;
    }

    // تغيير كمية منتج موجود بالسلة
    public static function update(int $productId, int $quantity): void
    {
        // كمية صفر أو أقل = نحذف المنتج
        if ($quantity <= 0) {
            self::remove($productId);
            return;
        }

        // ما نعدّل إلا لو المنتج موجود بالسلة
        if (isset($_SESSION['cart'][$productId])) {
            // الحد الأقصى 99
            if ($quantity > 99) {
                $quantity = 99;
            }
            $_SESSION['cart'][$productId] = $quantity;
        }
    }

    // حذف منتج من السلة
    public static function remove(int $productId): void
    {
        unset($_SESSION['cart'][$productId]);
    }

    // تفريغ السلة بالكامل
    public static function clear(): void
    {
        unset($_SESSION['cart']);
    }

    // مجموع عدد القطع بالسلة (مثلاً 2 + 1 = 3)
    public static function count(): int
    {
        if (empty($_SESSION['cart'])) {
            return 0;
        }
        return array_sum($_SESSION['cart']);
    }

    // بترجّع المنتجات اللي بالسلة مع بياناتها الكاملة وأسعارها من قاعدة البيانات
    public static function items(): array
    {
        // السلة فاضية؟ ما في شي نعمله
        if (empty($_SESSION['cart'])) {
            return [];
        }

        $cart       = $_SESSION['cart'];
        $productIds = array_keys($cart); // مثلاً [5, 8]

        // نجهّز علامات ? بعدد المنتجات. لو عندنا 3 منتجات بتصير: ?,?,?
        $placeholders = implode(',', array_fill(0, count($productIds), '?'));

        // نجيب كل المنتجات بطلب واحد لقاعدة البيانات
        $sql  = "SELECT id, name, price, stock, image FROM products WHERE id IN ($placeholders)";
        $stmt = Database::connect()->prepare($sql);
        $stmt->execute($productIds);
        $products = $stmt->fetchAll();

        $items = [];

        foreach ($products as $product) {
            $quantity = $cart[$product['id']];

            // لو الكمية أكبر من المخزون الحالي، نخفضها
            if ($quantity > $product['stock']) {
                $quantity = $product['stock'];
            }

            // لو المنتج خلص، نشيله من السلة وننتقل للي بعده
            if ($quantity < 1) {
                self::remove((int) $product['id']);
                continue;
            }

            $product['qty']      = $quantity;
            $product['subtotal'] = $quantity * $product['price'];
            $items[] = $product;
        }

        return $items;
    }

    // مجموع سعر كل المنتجات (بنمرّر له نتيجة items())
    public static function total(array $items): float
    {
        $total = 0;
        foreach ($items as $item) {
            $total += $item['subtotal'];
        }
        return $total;
    }
}