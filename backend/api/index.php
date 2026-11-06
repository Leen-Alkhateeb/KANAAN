<?php
/**
 * KANAAN JSON API  (frontend/api.php?action=...)
 * نسخة مبسّطة: نفس الوظائف بكود أقصر
 */
require_once __DIR__ . '/../init.php';
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

/* ================= دوال مساعدة ================= */

// رد JSON وإنهاء
function out($data, $status = 200) { http_response_code($status); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }

// رد خطأ (عربي + إنجليزي)
function fail($ar, $en, $status = 400) { out(['error' => $ar, 'error_en' => $en], $status); }

// قراءة البيانات المرسلة (JSON أو فورم)
function body() { $v = json_decode(file_get_contents('php://input'), true); return is_array($v) ? $v : $_POST; }

// نص مقصوص ومنظف
function str($b, $k, $max = 255) { return mb_substr(trim((string)($b[$k] ?? '')), 0, $max); }

// رقم صحيح من المدخلات
function num($b, $k) { return (int)($b[$k] ?? 0); }

// تشغيل استعلام وإرجاع الـ statement
function q(PDO $db, $sql, $v = []) { $s = $db->prepare($sql); $s->execute($v); return $s; }

// صلاحيات
function post_only() { if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('الطريقة غير مسموحة', 'Method not allowed', 405); }
function need_login() { $u = Auth::user(); if (!$u) fail('يرجى تسجيل الدخول أولاً', 'Please sign in first', 401); return $u; }
function need_admin() { if (!Auth::isAdmin()) fail('غير مصرح', 'Not authorised', 403); }

// تسجيل النشاط (لو فشل ما يوقف الطلب)
function log_activity(PDO $db, $action, $details = '') {
    try { q($db, 'INSERT INTO activity_logs (user_id, action, details) VALUES (?,?,?)', [Auth::id() ?: null, $action, mb_substr($details, 0, 255)]); }
    catch (Throwable $e) { error_log($e); }
}

// عناصر مجموعة طلبات مجمّعة حسب رقم الطلب
function order_items(PDO $db, array $ids) {
    if (!$ids) return [];
    $in = implode(',', array_fill(0, count($ids), '?'));
    $map = [];
    foreach (q($db, "SELECT order_id, product_id, product_name, unit_price, quantity FROM order_items WHERE order_id IN ($in) ORDER BY id", array_values($ids))->fetchAll() as $r)
        $map[$r['order_id']][] = $r;
    return $map;
}

// التحقق من بيانات الحساب (تسجيل + إعداد الأدمن) — يرجّع [اسم، إيميل، باسورد]
function account_input($b) {
    $n = str($b, 'name', 100); $e = strtolower(str($b, 'email', 150)); $p = (string)($b['password'] ?? '');
    if (mb_strlen($n) < 3 || !filter_var($e, FILTER_VALIDATE_EMAIL) || strlen($p) < 8)
        fail('تحقق من الاسم والبريد وكلمة المرور (8 أحرف على الأقل)', 'Check your name, email and password (8+ characters)', 422);
    if (Auth::emailExists($e)) fail('البريد مسجل مسبقاً', 'This email is already registered', 409);
    return [$n, $e, $p];
}

// رفع صورة اختيارية (يرجّع null لو ما في صورة)
function upload_image($folder) {
    if (empty($_FILES['image']['name'])) return null;
    try { return ImageUploader::save($_FILES['image'], $folder); }
    catch (RuntimeException $e) { fail($e->getMessage(), $e->getMessage(), 422); }
}

/* ================= التشغيل ================= */

$db = Database::connect();
$action = $_GET['action'] ?? '';

try {
switch ($action) {

/* ---------- عام ---------- */

case 'health': out(['ok' => true, 'app' => 'KANAAN API']);

case 'products': // بحث (q) + فلتر تصنيف (category)
    $term = trim($_GET['q'] ?? ''); $cat = (int)($_GET['category'] ?? 0);
    $sql = 'SELECT p.*, c.name category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE 1=1';
    $v = [];
    if ($term !== '') { $sql .= ' AND (p.name LIKE ? OR p.description LIKE ?)'; $v = ["%$term%", "%$term%"]; }
    if ($cat) { $sql .= ' AND p.category_id = ?'; $v[] = $cat; }
    out(['items' => q($db, $sql . ' ORDER BY p.id DESC', $v)->fetchAll()]);

case 'product':
    $p = q($db, 'SELECT p.*, c.name category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?', [(int)($_GET['id'] ?? 0)])->fetch();
    if (!$p) fail('المنتج غير موجود', 'Product not found', 404);
    out(['item' => $p]);

case 'categories':
    out(['items' => $db->query('SELECT * FROM categories ORDER BY id')->fetchAll()]);

case 'img': // عرض صورة مرفوعة (مسارات مسموحة فقط)
    $path = (string)($_GET['path'] ?? '');
    if (!preg_match('#^uploads/(products|categories|users)/[a-f0-9]{32}\.(jpg|png|webp)$#', $path, $m)) { http_response_code(404); exit; }
    if ($m[1] === 'users') { // صور المستخدمين: صاحبها أو الأدمن فقط
        if (!Auth::check()) { http_response_code(404); exit; }
        if (!Auth::isAdmin()) {
            $own = q($db, 'SELECT id FROM users WHERE id = ? AND profile_image = ?
                           UNION SELECT user_id FROM user_images WHERE user_id = ? AND image_path = ? LIMIT 1',
                     [Auth::id(), $path, Auth::id(), $path])->fetchColumn();
            if (!$own) { http_response_code(404); exit; }
        }
    }
    $full = ROOT_PATH . '/' . $path;
    if (!is_file($full)) { http_response_code(404); exit; }
    $types = ['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];
    header('Content-Type: ' . $types[$m[2]]);
    header('Cache-Control: public, max-age=86400');
    header('Content-Length: ' . filesize($full));
    readfile($full);
    exit;

/* ---------- الحساب ---------- */

case 'register':
    post_only();
    [$n, $e, $p] = account_input(body());
    Auth::register($n, $e, $p);
    Auth::attempt($e, $p); // دخول تلقائي
    out(['ok' => true, 'user' => Auth::user()]);

case 'login':
    post_only(); $b = body();
    if (!Auth::attempt(strtolower(str($b, 'email', 150)), (string)($b['password'] ?? '')))
        fail('بيانات الدخول غير صحيحة', 'Incorrect email or password', 401);
    out(['ok' => true, 'user' => Auth::user()]);

case 'logout': Auth::logout(); out(['ok' => true]);
case 'me': out(['user' => Auth::user()]);

case 'profile':
    out(['user' => UserProfile::find((int)need_login()['id'])]);

case 'my-images':
    out(['items' => UserGallery::allForUser((int)need_login()['id'])]);

case 'user-image-upload':
    post_only(); $u = need_login();
    if (empty($_FILES['image'])) fail('اختر صورة أولاً', 'Please choose an image first', 422);
    try {
        $image = UserGallery::add((int)$u['id'], $_FILES['image']);
        log_activity($db, 'user.image_upload', 'Uploaded account photo #' . $image['id']);
        out(['ok' => true, 'item' => $image]);
    } catch (Throwable $e) { fail($e->getMessage(), 'Unable to upload image', 422); }

case 'profile-image':
    post_only(); $u = need_login();
    if (empty($_FILES['image'])) fail('اختر صورة أولاً', 'Please choose an image first', 422);
    try {
        $path = UserProfile::updateImage((int)$u['id'], $_FILES['image']);
        $_SESSION['user']['profile_image'] = $path;
        log_activity($db, 'user.profile_image', 'Updated profile image');
        out(['ok' => true, 'profile_image' => $path]);
    } catch (Throwable $e) { fail($e->getMessage(), 'Unable to save profile image', 422); }

case 'change-password':
    post_only(); $u = need_login(); $b = body();
    $new = (string)($b['password'] ?? '');
    if (strlen($new) < 8) fail('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل', 'New password must be at least 8 characters', 422);
    $hash = (string)q($db, 'SELECT password_hash FROM users WHERE id = ?', [$u['id']])->fetchColumn();
    if (!password_verify((string)($b['current'] ?? ''), $hash)) fail('كلمة المرور الحالية غير صحيحة', 'Current password is incorrect', 403);
    q($db, 'UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($new, PASSWORD_DEFAULT), $u['id']]);
    out(['ok' => true]);

/* ---------- إعداد أول أدمن (مرة وحدة فقط) ---------- */

case 'setup-status':
    out(['needs_setup' => (int)$db->query("SELECT COUNT(*) FROM users WHERE role='admin'")->fetchColumn() === 0]);

case 'setup-admin':
    post_only();
    if ((int)$db->query("SELECT COUNT(*) FROM users WHERE role='admin'")->fetchColumn() > 0)
        fail('تم إعداد حساب الأدمن مسبقاً', 'The admin account is already set up', 403);
    [$n, $e, $p] = account_input(body());
    q($db, 'INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,"admin")', [$n, $e, password_hash($p, PASSWORD_DEFAULT)]);
    Auth::attempt($e, $p);
    log_activity($db, 'admin.setup', $e);
    out(['ok' => true, 'user' => Auth::user()]);

/* ---------- السلة ---------- */

case 'cart':
    $it = Cart::items();
    out(['items' => $it, 'count' => Cart::count(), 'total' => Cart::total($it)]);

case 'cart-add':
    post_only(); $b = body();
    if (!Cart::add(num($b, 'id'), (int)($b['qty'] ?? 1))) fail('المنتج غير متوفر', 'This product is out of stock', 422);
    out(['ok' => true]);

case 'cart-update':
    post_only(); $b = body();
    $id = num($b, 'id'); $qty = (int)($b['qty'] ?? 1);
    $stock = q($db, 'SELECT stock FROM products WHERE id = ?', [$id])->fetchColumn();
    if ($stock === false) { Cart::remove($id); out(['ok' => true]); } // المنتج انحذف
    if ($qty > (int)$stock) fail('الكمية المطلوبة أكبر من المتوفر', 'Requested quantity exceeds stock', 422);
    Cart::update($id, $qty);
    out(['ok' => true]);

case 'cart-remove':
    post_only(); Cart::remove(num(body(), 'id'));
    out(['ok' => true]);

/* ---------- الطلبات ---------- */

case 'orders-create':
    post_only(); $u = need_login(); $b = body();
    $name = str($b, 'name', 100); $phone = str($b, 'phone', 30); $city = str($b, 'city', 80);
    $addr = str($b, 'address', 255); $notes = str($b, 'notes', 500);
    if (mb_strlen($name) < 3 || !preg_match('/^[\d+\s()-]{7,30}$/', $phone) || $city === '' || mb_strlen($addr) < 5)
        fail('يرجى تعبئة كل الحقول المطلوبة بشكل صحيح', 'Please fill in all required fields correctly', 422);
    $cart = $_SESSION['cart'] ?? [];
    if (!$cart) fail('السلة فارغة', 'Your cart is empty', 422);

    $db->beginTransaction(); // كل شي أو لا شي
    try {
        $ids = array_map('intval', array_keys($cart));
        $in = implode(',', array_fill(0, count($ids), '?'));
        // FOR UPDATE: قفل المنتجات لمنع بيع نفس المخزون مرتين
        $found = [];
        foreach (q($db, "SELECT id, name, price, stock FROM products WHERE id IN ($in) FOR UPDATE", $ids)->fetchAll() as $p) $found[(int)$p['id']] = $p;

        // التحقق من المخزون وحساب المجموع من الأسعار الحقيقية
        $lines = []; $total = 0.0;
        foreach ($cart as $pid => $qty) {
            $pid = (int)$pid; $qty = (int)$qty; $p = $found[$pid] ?? null;
            if (!$p || (int)$p['stock'] < $qty) throw new RuntimeException('stock', 409);
            $lines[] = [$pid, $p['name'], (float)$p['price'], $qty];
            $total += (float)$p['price'] * $qty;
        }

        q($db, 'INSERT INTO orders (user_id, full_name, phone, city, address, notes, total) VALUES (?,?,?,?,?,?,?)',
          [$u['id'], $name, $phone, $city, $addr, $notes !== '' ? $notes : null, round($total, 2)]);
        $oid = (int)$db->lastInsertId();

        foreach ($lines as [$pid, $pname, $price, $qty]) {
            q($db, 'INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) VALUES (?,?,?,?,?)', [$oid, $pid, $pname, $price, $qty]);
            q($db, 'UPDATE products SET stock = stock - ? WHERE id = ?', [$qty, $pid]); // إنقاص المخزون
        }
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        if ($e->getCode() === 409) fail('بعض المنتجات لم تعد متوفرة بالكمية المطلوبة. راجع السلة.', 'Some items are no longer available in the requested quantity. Please review your cart.', 409);
        throw $e;
    }
    Cart::clear();
    log_activity($db, 'order.create', "#$oid — " . number_format($total, 2));
    out(['ok' => true, 'id' => $oid]);

case 'my-orders':
    $u = need_login();
    $orders = q($db, 'SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [$u['id']])->fetchAll();
    $items = order_items($db, array_column($orders, 'id'));
    foreach ($orders as &$o) $o['items'] = $items[$o['id']] ?? [];
    out(['items' => $orders]);

case 'order': // صاحب الطلب أو الأدمن فقط
    $u = need_login();
    $o = q($db, 'SELECT * FROM orders WHERE id = ?', [(int)($_GET['id'] ?? 0)])->fetch();
    if (!$o || ((int)$o['user_id'] !== (int)$u['id'] && !Auth::isAdmin())) fail('الطلب غير موجود', 'Order not found', 404);
    $o['items'] = order_items($db, [$o['id']])[$o['id']] ?? [];
    out(['order' => $o]);

/* ---------- أدمن: إحصائيات وطلبات ---------- */

case 'admin-stats':
    need_admin();
    out(AdminDashboard::statistics($db));

case 'admin-orders':
    need_admin();
    $st = $_GET['status'] ?? '';
    $sql = 'SELECT o.id, o.full_name, o.phone, o.city, o.total, o.status, o.payment_status, o.created_at, u.email,
                   (SELECT COALESCE(SUM(quantity),0) FROM order_items WHERE order_id = o.id) items_count
            FROM orders o LEFT JOIN users u ON u.id = o.user_id';
    $v = [];
    if (isset(ORDER_STATUSES[$st])) { $sql .= ' WHERE o.status = ?'; $v[] = $st; }
    out(['items' => q($db, $sql . ' ORDER BY o.id DESC', $v)->fetchAll()]);

case 'admin-order':
    need_admin();
    $o = q($db, 'SELECT o.*, u.email, u.name user_name FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = ?', [(int)($_GET['id'] ?? 0)])->fetch();
    if (!$o) fail('الطلب غير موجود', 'Order not found', 404);
    $o['items'] = order_items($db, [$o['id']])[$o['id']] ?? [];
    out(['order' => $o]);

case 'admin-order-update':
    post_only(); need_admin(); $b = body();
    $id = num($b, 'id'); $status = (string)($b['status'] ?? ''); $pay = (string)($b['payment_status'] ?? '');
    if (!isset(ORDER_STATUSES[$status]) || !isset(PAYMENT_STATUSES[$pay])) fail('قيمة غير صالحة', 'Invalid value', 422);
    $db->beginTransaction();
    try {
        $old = q($db, 'SELECT status FROM orders WHERE id = ? FOR UPDATE', [$id])->fetchColumn();
        if ($old === false) { $db->rollBack(); fail('الطلب غير موجود', 'Order not found', 404); }
        if ($old === 'Cancelled' && $status !== 'Cancelled') { $db->rollBack(); fail('لا يمكن إعادة تفعيل طلب ملغي', 'A cancelled order cannot be reopened', 409); }
        if ($status === 'Cancelled' && $old !== 'Cancelled') // عند الإلغاء نرجّع المخزون
            q($db, 'UPDATE products p JOIN order_items i ON i.product_id = p.id SET p.stock = p.stock + i.quantity WHERE i.order_id = ?', [$id]);
        q($db, 'UPDATE orders SET status = ?, payment_status = ? WHERE id = ?', [$status, $pay, $id]);
        $db->commit();
    } catch (Throwable $e) { if ($db->inTransaction()) $db->rollBack(); throw $e; }
    log_activity($db, 'order.update', "#$id → $status / $pay");
    out(['ok' => true]);

/* ---------- أدمن: المستخدمين ---------- */

case 'admin-users':
    need_admin();
    out(['items' => $db->query('SELECT u.id, u.name, u.email, u.role, u.phone, u.profile_image, u.created_at,
        (SELECT COUNT(*) FROM orders WHERE user_id = u.id) orders_count,
        (SELECT COUNT(*) FROM user_images WHERE user_id = u.id) images_count FROM users u ORDER BY u.id DESC')->fetchAll()]);

case 'admin-user-images':
    need_admin();
    out(['items' => q($db, 'SELECT i.id, i.user_id, i.image_path, i.created_at, u.name, u.email
                            FROM user_images i INNER JOIN users u ON u.id = i.user_id
                            WHERE i.user_id = ? ORDER BY i.id DESC', [(int)($_GET['user_id'] ?? 0)])->fetchAll()]);

case 'admin-user-update':
    post_only(); need_admin(); $b = body();
    $id = num($b, 'id'); $role = (string)($b['role'] ?? '');
    if (!in_array($role, ['customer', 'admin'], true)) fail('قيمة غير صالحة', 'Invalid value', 422);
    if ($id === Auth::id()) fail('لا يمكنك تغيير دور حسابك', 'You cannot change your own role', 409);
    q($db, 'UPDATE users SET role = ? WHERE id = ?', [$role, $id]);
    log_activity($db, 'user.role', "#$id → $role");
    out(['ok' => true]);

case 'admin-user-delete':
    post_only(); need_admin(); $id = num(body(), 'id');
    if ($id === Auth::id()) fail('لا يمكنك حذف حسابك', 'You cannot delete your own account', 409);
    if ((int)q($db, 'SELECT COUNT(*) FROM orders WHERE user_id = ?', [$id])->fetchColumn() > 0)
        fail('لا يمكن حذف مستخدم لديه طلبات', 'Cannot delete a user who has orders', 409);
    q($db, 'DELETE FROM users WHERE id = ?', [$id]);
    log_activity($db, 'user.delete', "#$id");
    out(['ok' => true]);

/* ---------- أدمن: المنتجات ---------- */

case 'admin-product-save': // id موجود = تعديل، غيره = إضافة
    post_only(); need_admin(); $b = body();
    $id = num($b, 'id'); $cat = num($b, 'category_id');
    $name = str($b, 'name', 150); $desc = str($b, 'description', 5000);
    $price = (string)($b['price'] ?? ''); $stock = (string)($b['stock'] ?? '0');
    $art = str($b, 'artisan_name', 100); $story = str($b, 'artisan_story', 5000);
    if (mb_strlen($name) < 2 || !is_numeric($price) || (float)$price < 0 || !ctype_digit($stock))
        fail('تحقق من الاسم والسعر والكمية', 'Check the name, price and stock', 422);
    $newImg = upload_image('products');
    if ($id) {
        $oldImg = q($db, 'SELECT image FROM products WHERE id = ?', [$id])->fetchColumn();
        if ($oldImg === false) fail('المنتج غير موجود', 'Product not found', 404);
        // COALESCE: لو ما في صورة جديدة منبقي القديمة
        q($db, 'UPDATE products SET category_id=?, name=?, description=?, price=?, stock=?, artisan_name=?, artisan_story=?, image=COALESCE(?, image) WHERE id=?',
          [$cat ?: null, $name, $desc ?: null, $price, (int)$stock, $art ?: null, $story ?: null, $newImg, $id]);
        if ($newImg && $oldImg) ImageUploader::delete($oldImg);
        log_activity($db, 'product.update', "#$id $name");
    } else {
        q($db, 'INSERT INTO products (category_id, name, description, price, stock, image, artisan_name, artisan_story) VALUES (?,?,?,?,?,?,?,?)',
          [$cat ?: null, $name, $desc ?: null, $price, (int)$stock, $newImg, $art ?: null, $story ?: null]);
        $id = (int)$db->lastInsertId();
        log_activity($db, 'product.create', "#$id $name");
    }
    out(['ok' => true, 'id' => $id]);

case 'admin-product-image':
    post_only(); need_admin();
    $id = (int)($_POST['id'] ?? 0);
    $old = q($db, 'SELECT image FROM products WHERE id = ?', [$id])->fetchColumn();
    if ($old === false) fail('المنتج غير موجود', 'Product not found', 404);
    $img = upload_image('products');
    if (!$img) fail('اختر صورة أولاً', 'Choose an image first', 422);
    q($db, 'UPDATE products SET image = ? WHERE id = ?', [$img, $id]);
    if ($old) ImageUploader::delete($old);
    log_activity($db, 'product.image', "#$id");
    out(['ok' => true, 'image' => $img]);

case 'admin-product-delete':
    post_only(); need_admin(); $id = num(body(), 'id');
    $p = q($db, 'SELECT image, name FROM products WHERE id = ?', [$id])->fetch();
    if (!$p) fail('المنتج غير موجود', 'Product not found', 404);
    q($db, 'DELETE FROM products WHERE id = ?', [$id]);
    ImageUploader::delete($p['image']);
    log_activity($db, 'product.delete', "#$id {$p['name']}");
    out(['ok' => true]);

/* ---------- أدمن: التصنيفات ---------- */

case 'admin-category-save': // id موجود = تعديل، غيره = إضافة
    post_only(); need_admin(); $b = body();
    $id = num($b, 'id'); $name = str($b, 'name', 100); $desc = str($b, 'description', 2000);
    if (mb_strlen($name) < 2) fail('اسم التصنيف قصير', 'Category name is too short', 422);
    $newImg = upload_image('categories');
    try {
        if ($id) {
            $old = q($db, 'SELECT image FROM categories WHERE id = ?', [$id])->fetchColumn();
            if ($old === false) fail('التصنيف غير موجود', 'Category not found', 404);
            q($db, 'UPDATE categories SET name=?, description=?, image=COALESCE(?, image) WHERE id=?', [$name, $desc ?: null, $newImg, $id]);
            if ($newImg && $old) ImageUploader::delete($old);
            log_activity($db, 'category.update', "#$id $name");
        } else {
            q($db, 'INSERT INTO categories (name, description, image) VALUES (?,?,?)', [$name, $desc ?: null, $newImg]);
            $id = (int)$db->lastInsertId();
            log_activity($db, 'category.create', "#$id $name");
        }
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') fail('اسم التصنيف مستخدم مسبقاً', 'This category name already exists', 409); // اسم مكرر
        throw $e;
    }
    out(['ok' => true, 'id' => $id]);

case 'admin-category-delete':
    post_only(); need_admin(); $id = num(body(), 'id');
    if ((int)q($db, 'SELECT COUNT(*) FROM products WHERE category_id = ?', [$id])->fetchColumn() > 0)
        fail('لا يمكن حذف تصنيف يحتوي منتجات', 'Cannot delete a category that has products', 409);
    $img = q($db, 'SELECT image FROM categories WHERE id = ?', [$id])->fetchColumn();
    q($db, 'DELETE FROM categories WHERE id = ?', [$id]);
    if ($img) ImageUploader::delete($img);
    log_activity($db, 'category.delete', "#$id");
    out(['ok' => true]);

/* ---------- أدمن: الحرفيين والسجل ---------- */

case 'admin-artisans':
    need_admin();
    out(['items' => $db->query("SELECT artisan_name, MAX(artisan_story) artisan_story, COUNT(*) products_count
        FROM products WHERE artisan_name IS NOT NULL AND artisan_name <> '' GROUP BY artisan_name ORDER BY artisan_name")->fetchAll()]);

case 'admin-logs': // آخر 200 عملية
    need_admin();
    out(['items' => $db->query('SELECT l.id, l.action, l.details, l.created_at, u.name user_name
        FROM activity_logs l LEFT JOIN users u ON u.id = l.user_id ORDER BY l.id DESC LIMIT 200')->fetchAll()]);

default: fail('عملية غير معروفة', 'Unknown API action', 404);
}
} catch (Throwable $e) {
    error_log($e); // خطأ غير متوقع: نسجله ونرجّع رسالة عامة
    fail('حدث خطأ في الخادم', 'Server error', 500);
}