<?php

require_once __DIR__ . '/../init.php';

header('Content-Type: application/json; charset=utf-8'); // الرد دايماً JSON
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');


/* ============================================================
   1) أدوات صغيرة
   ============================================================ */

// يرد بالنتيجة ويوقف الكود
function out($data, $status = 200)
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// يرد برسالة خطأ (عربي + إنجليزي)
function fail($ar, $en, $status = 400)
{
    out(['error' => $ar, 'error_en' => $en], $status);
}

// يقرأ البيانات اللي بعتها الموقع (JSON أو فورم عادي)
function body()
{
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : $_POST;
}

// ياخد نص من البيانات، يشيل الفراغات، ويقصه لطول معين
function str($data, $key, $max = 255)
{
    $value = isset($data[$key]) ? (string)$data[$key] : '';
    return mb_substr(trim($value), 0, $max);
}

// ينفذ أمر SQL بشكل آمن (القيم بتنحط مكان علامات ؟)
function q($db, $sql, $values = [])
{
    $statement = $db->prepare($sql);
    $statement->execute($values);
    return $statement;
}

// يقبل طلبات POST بس
function post_only()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        fail('الطريقة غير مسموحة', 'Method not allowed', 405);
    }
}

// لازم يكون مسجل دخول، وبيرجع بيانات المستخدم
function need_login()
{
    $user = Auth::user();
    if (!$user) {
        fail('يرجى تسجيل الدخول أولاً', 'Please sign in first', 401);
    }
    return $user;
}

// لازم يكون أدمن
function need_admin()
{
    if (!Auth::isAdmin()) {
        fail('غير مصرح', 'Not authorised', 403);
    }
}

// يكتب في سجل النشاط (لو فشل ما بيوقف الطلب)
function log_activity($db, $action, $details = '')
{
    try {
        $userId = Auth::id() ? Auth::id() : null;
        q($db, 'INSERT INTO activity_logs (user_id, action, details) VALUES (?,?,?)',
            [$userId, $action, mb_substr($details, 0, 255)]);
    } catch (Throwable $e) {
        error_log($e);
    }
}

// يجيب منتجات طلب واحد
function order_items($db, $orderId)
{
    return q($db, 'SELECT order_id, product_id, product_name, unit_price, quantity
                   FROM order_items WHERE order_id = ? ORDER BY id', [$orderId])->fetchAll();
}

// يتأكد من بيانات حساب جديد، وبيرجع [اسم، إيميل، باسورد]
function check_account($data)
{
    $name     = str($data, 'name', 100);
    $email    = strtolower(str($data, 'email', 150));
    $password = isset($data['password']) ? (string)$data['password'] : '';

    if (mb_strlen($name) < 3 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
        fail('تحقق من الاسم والبريد وكلمة المرور (8 أحرف على الأقل)',
             'Check your name, email and password (8+ characters)', 422);
    }
    if (Auth::emailExists($email)) {
        fail('البريد مسجل مسبقاً', 'This email is already registered', 409);
    }
    return [$name, $email, $password];
}

// يرفع صورة (اختيارية). لو ما في صورة بيرجع null
function upload_image($folder)
{
    if (empty($_FILES['image']['name'])) {
        return null;
    }
    try {
        return ImageUploader::save($_FILES['image'], $folder);
    } catch (RuntimeException $e) {
        fail($e->getMessage(), $e->getMessage(), 422);
    }
}


/* ============================================================
   2) عمليات عامة (بدون تسجيل دخول)
   ============================================================ */

function do_health()
{
    out(['ok' => true, 'app' => 'KANAAN API']);
}

// قائمة المنتجات، مع بحث (q) وفلتر تصنيف (category)
function do_products($db)
{
    $term     = trim($_GET['q'] ?? '');
    $category = (int)($_GET['category'] ?? 0);

    $sql = 'SELECT p.*, c.name category_name
            FROM products p LEFT JOIN categories c ON c.id = p.category_id
            WHERE 1=1';
    $values = [];

    if ($term !== '') {
        $sql .= ' AND (p.name LIKE ? OR p.description LIKE ?)';
        $values[] = "%$term%";
        $values[] = "%$term%";
    }
    if ($category) {
        $sql .= ' AND p.category_id = ?';
        $values[] = $category;
    }

    $items = q($db, $sql . ' ORDER BY p.id DESC', $values)->fetchAll();
    out(['items' => $items]);
}

function do_product($db)
{
    $id = (int)($_GET['id'] ?? 0);
    $product = q($db, 'SELECT p.*, c.name category_name
                       FROM products p LEFT JOIN categories c ON c.id = p.category_id
                       WHERE p.id = ?', [$id])->fetch();

    if (!$product) {
        fail('المنتج غير موجود', 'Product not found', 404);
    }
    out(['item' => $product]);
}

function do_categories($db)
{
    out(['items' => $db->query('SELECT * FROM categories ORDER BY id')->fetchAll()]);
}

// عرض صورة مرفوعة (بس لو المسار بالشكل المسموح)
function do_img($db)
{
    $path = (string)($_GET['path'] ?? '');

    // المسار لازم يكون: uploads/المجلد/اسم_عشوائي.امتداد (يمنع قراءة ملفات السيرفر)
    if (!preg_match('#^uploads/(products|categories|users)/[a-f0-9]{32}\.(jpg|png|webp)$#', $path, $m)) {
        http_response_code(404);
        exit;
    }
    $folder = $m[1];
    $ext    = $m[2];

    // صور المستخدمين خاصة: لصاحبها أو للأدمن بس
    if ($folder === 'users') {
        if (!Auth::check()) {
            http_response_code(404);
            exit;
        }
        if (!Auth::isAdmin()) {
            $myId = Auth::id();
            $isProfile = q($db, 'SELECT id FROM users WHERE id = ? AND profile_image = ?', [$myId, $path])->fetchColumn();
            $isGallery = q($db, 'SELECT id FROM user_images WHERE user_id = ? AND image_path = ?', [$myId, $path])->fetchColumn();
            if (!$isProfile && !$isGallery) {
                http_response_code(404);
                exit;
            }
        }
    }

    $fullPath = ROOT_PATH . '/' . $path;
    if (!is_file($fullPath)) {
        http_response_code(404);
        exit;
    }

    $types = ['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];
    header('Content-Type: ' . $types[$ext]);
    header('Cache-Control: public, max-age=86400');
    header('Content-Length: ' . filesize($fullPath));
    readfile($fullPath);
    exit;
}


/* ============================================================
   3) الحساب
   ============================================================ */

function do_register()
{
    post_only();
    [$name, $email, $password] = check_account(body());
    Auth::register($name, $email, $password);
    Auth::attempt($email, $password); // دخول تلقائي بعد التسجيل
    out(['ok' => true, 'user' => Auth::user()]);
}

function do_login()
{
    post_only();
    $data     = body();
    $email    = strtolower(str($data, 'email', 150));
    $password = isset($data['password']) ? (string)$data['password'] : '';

    if (!Auth::attempt($email, $password)) {
        fail('بيانات الدخول غير صحيحة', 'Incorrect email or password', 401);
    }
    out(['ok' => true, 'user' => Auth::user()]);
}

function do_logout()
{
    Auth::logout();
    out(['ok' => true]);
}

function do_me()
{
    out(['user' => Auth::user()]);
}

function do_profile()
{
    $user = need_login();
    out(['user' => UserProfile::find((int)$user['id'])]);
}

function do_my_images()
{
    $user = need_login();
    out(['items' => UserGallery::allForUser((int)$user['id'])]);
}

// رفع صورة لمعرض المستخدم
function do_user_image_upload($db)
{
    post_only();
    $user = need_login();
    if (empty($_FILES['image'])) {
        fail('اختر صورة أولاً', 'Please choose an image first', 422);
    }
    try {
        $image = UserGallery::add((int)$user['id'], $_FILES['image']);
        log_activity($db, 'user.image_upload', 'Uploaded account photo #' . $image['id']);
        out(['ok' => true, 'item' => $image]);
    } catch (Throwable $e) {
        fail($e->getMessage(), 'Unable to upload image', 422);
    }
}

// تغيير صورة البروفايل
function do_profile_image($db)
{
    post_only();
    $user = need_login();
    if (empty($_FILES['image'])) {
        fail('اختر صورة أولاً', 'Please choose an image first', 422);
    }
    try {
        $path = UserProfile::updateImage((int)$user['id'], $_FILES['image']);
        $_SESSION['user']['profile_image'] = $path; // عشان تظهر الصورة الجديدة فوراً
        log_activity($db, 'user.profile_image', 'Updated profile image');
        out(['ok' => true, 'profile_image' => $path]);
    } catch (Throwable $e) {
        fail($e->getMessage(), 'Unable to save profile image', 422);
    }
}

function do_change_password($db)
{
    post_only();
    $user = need_login();
    $data = body();

    $newPassword     = isset($data['password']) ? (string)$data['password'] : '';
    $currentPassword = isset($data['current'])  ? (string)$data['current']  : '';

    if (strlen($newPassword) < 8) {
        fail('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل',
             'New password must be at least 8 characters', 422);
    }

    $oldHash = (string)q($db, 'SELECT password_hash FROM users WHERE id = ?', [$user['id']])->fetchColumn();
    if (!password_verify($currentPassword, $oldHash)) {
        fail('كلمة المرور الحالية غير صحيحة', 'Current password is incorrect', 403);
    }

    q($db, 'UPDATE users SET password_hash = ? WHERE id = ?',
        [password_hash($newPassword, PASSWORD_DEFAULT), $user['id']]);
    out(['ok' => true]);
}


/* ============================================================
   4) إعداد أول أدمن (مرة وحدة بس)
   ============================================================ */

function admins_count($db)
{
    return (int)$db->query("SELECT COUNT(*) FROM users WHERE role='admin'")->fetchColumn();
}

function do_setup_status($db)
{
    out(['needs_setup' => admins_count($db) === 0]);
}

function do_setup_admin($db)
{
    post_only();
    if (admins_count($db) > 0) {
        fail('تم إعداد حساب الأدمن مسبقاً', 'The admin account is already set up', 403);
    }
    [$name, $email, $password] = check_account(body());

    q($db, 'INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,"admin")',
        [$name, $email, password_hash($password, PASSWORD_DEFAULT)]);

    Auth::attempt($email, $password);
    log_activity($db, 'admin.setup', $email);
    out(['ok' => true, 'user' => Auth::user()]);
}


/* ============================================================
   5) السلة
   ============================================================ */

function do_cart()
{
    $items = Cart::items();
    out(['items' => $items, 'count' => Cart::count(), 'total' => Cart::total($items)]);
}

function do_cart_add()
{
    post_only();
    $data = body();
    $id  = (int)($data['id'] ?? 0);
    $qty = isset($data['qty']) ? (int)$data['qty'] : 1;

    if (!Cart::add($id, $qty)) {
        fail('المنتج غير متوفر', 'This product is out of stock', 422);
    }
    out(['ok' => true]);
}

function do_cart_update($db)
{
    post_only();
    $data = body();
    $id  = (int)($data['id'] ?? 0);
    $qty = isset($data['qty']) ? (int)$data['qty'] : 1;

    $stock = q($db, 'SELECT stock FROM products WHERE id = ?', [$id])->fetchColumn();

    if ($stock === false) {      // المنتج انحذف من القاعدة
        Cart::remove($id);
        out(['ok' => true]);
    }
    if ($qty > (int)$stock) {
        fail('الكمية المطلوبة أكبر من المتوفر', 'Requested quantity exceeds stock', 422);
    }
    Cart::update($id, $qty);
    out(['ok' => true]);
}

function do_cart_remove()
{
    post_only();
    $data = body();
    Cart::remove((int)($data['id'] ?? 0));
    out(['ok' => true]);
}


/* ============================================================
   6) الطلبات
   ============================================================ */

// تأكيد الطلب (أهم عملية، وفيها حساب المجموع)
function do_orders_create($db)
{
    post_only();
    $user = need_login();
    $data = body();

    // 1) بيانات التوصيل
    $name    = str($data, 'name', 100);
    $phone   = str($data, 'phone', 30);
    $city    = str($data, 'city', 80);
    $address = str($data, 'address', 255);
    $notes   = str($data, 'notes', 500);

    if (mb_strlen($name) < 3 || !preg_match('/^[\d+\s()-]{7,30}$/', $phone)
        || $city === '' || mb_strlen($address) < 5) {
        fail('يرجى تعبئة كل الحقول المطلوبة بشكل صحيح', 'Please fill in all required fields correctly', 422);
    }

    // 2) السلة
    $cart = $_SESSION['cart'] ?? [];
    if (!$cart) {
        fail('السلة فارغة', 'Your cart is empty', 422);
    }

    // 3) كل شي أو لا شي: لو أي خطوة فشلت بنرجع كل شي زي ما كان
    $db->beginTransaction();
    try {
        $lines = [];
        $total = 0.0;

        foreach ($cart as $productId => $qty) {
            $productId = (int)$productId;
            $qty = (int)$qty;

            // نجيب المنتج ونقفله (FOR UPDATE) عشان ما يشتري شخصين نفس القطعة الأخيرة
            $product = q($db, 'SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE', [$productId])->fetch();

            if (!$product || (int)$product['stock'] < $qty) {
                $db->rollBack();
                fail('بعض المنتجات لم تعد متوفرة بالكمية المطلوبة. راجع السلة.',
                     'Some items are no longer available in the requested quantity. Please review your cart.', 409);
            }

            // المجموع من الأسعار الحقيقية بالقاعدة (مش من الموقع)
            $lines[] = ['id' => $productId, 'name' => $product['name'], 'price' => (float)$product['price'], 'qty' => $qty];
            $total += (float)$product['price'] * $qty;
        }

        // نسجل الطلب
        q($db, 'INSERT INTO orders (user_id, full_name, phone, city, address, notes, total) VALUES (?,?,?,?,?,?,?)',
            [$user['id'], $name, $phone, $city, $address, $notes !== '' ? $notes : null, round($total, 2)]);
        $orderId = (int)$db->lastInsertId();

        // نسجل كل منتج بالطلب (مع اسمه وسعره وقت الشراء) وننقص المخزون
        foreach ($lines as $line) {
            q($db, 'INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) VALUES (?,?,?,?,?)',
                [$orderId, $line['id'], $line['name'], $line['price'], $line['qty']]);
            q($db, 'UPDATE products SET stock = stock - ? WHERE id = ?', [$line['qty'], $line['id']]);
        }

        $db->commit(); // تثبيت كل شي
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        throw $e; // خطأ غير متوقع: بيوصل للـ catch الكبير بالآخر
    }

    Cart::clear();
    log_activity($db, 'order.create', "#$orderId — " . number_format($total, 2));
    out(['ok' => true, 'id' => $orderId]);
}

// طلباتي
function do_my_orders($db)
{
    $user = need_login();
    $orders = q($db, 'SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [$user['id']])->fetchAll();

    foreach ($orders as $i => $order) {
        $orders[$i]['items'] = order_items($db, $order['id']);
    }
    out(['items' => $orders]);
}

// طلب واحد (لصاحبه أو للأدمن بس)
function do_order($db)
{
    $user  = need_login();
    $order = q($db, 'SELECT * FROM orders WHERE id = ?', [(int)($_GET['id'] ?? 0)])->fetch();

    $isOwner = $order && (int)$order['user_id'] === (int)$user['id'];
    if (!$order || (!$isOwner && !Auth::isAdmin())) {
        fail('الطلب غير موجود', 'Order not found', 404);
    }

    $order['items'] = order_items($db, $order['id']);
    out(['order' => $order]);
}


/* ============================================================
   7) أدمن: الإحصائيات والطلبات
   ============================================================ */

function do_admin_stats($db)
{
    need_admin();
    out(AdminDashboard::statistics($db));
}

function do_admin_orders($db)
{
    need_admin();
    $status = $_GET['status'] ?? '';

    $sql = 'SELECT o.id, o.full_name, o.phone, o.city, o.total, o.status, o.payment_status, o.created_at, u.email,
                   (SELECT COALESCE(SUM(quantity),0) FROM order_items WHERE order_id = o.id) items_count
            FROM orders o LEFT JOIN users u ON u.id = o.user_id';
    $values = [];

    if (isset(ORDER_STATUSES[$status])) {   // نقبل بس الحالات المعروفة
        $sql .= ' WHERE o.status = ?';
        $values[] = $status;
    }
    out(['items' => q($db, $sql . ' ORDER BY o.id DESC', $values)->fetchAll()]);
}

function do_admin_order($db)
{
    need_admin();
    $order = q($db, 'SELECT o.*, u.email, u.name user_name
                     FROM orders o LEFT JOIN users u ON u.id = o.user_id
                     WHERE o.id = ?', [(int)($_GET['id'] ?? 0)])->fetch();

    if (!$order) {
        fail('الطلب غير موجود', 'Order not found', 404);
    }
    $order['items'] = order_items($db, $order['id']);
    out(['order' => $order]);
}

// تغيير حالة الطلب والدفع
function do_admin_order_update($db)
{
    post_only();
    need_admin();
    $data = body();

    $id     = (int)($data['id'] ?? 0);
    $status = isset($data['status']) ? (string)$data['status'] : '';
    $pay    = isset($data['payment_status']) ? (string)$data['payment_status'] : '';

    if (!isset(ORDER_STATUSES[$status]) || !isset(PAYMENT_STATUSES[$pay])) {
        fail('قيمة غير صالحة', 'Invalid value', 422);
    }

    $db->beginTransaction();
    try {
        $oldStatus = q($db, 'SELECT status FROM orders WHERE id = ? FOR UPDATE', [$id])->fetchColumn();

        if ($oldStatus === false) {
            $db->rollBack();
            fail('الطلب غير موجود', 'Order not found', 404);
        }
        if ($oldStatus === 'Cancelled' && $status !== 'Cancelled') {
            $db->rollBack();
            fail('لا يمكن إعادة تفعيل طلب ملغي', 'A cancelled order cannot be reopened', 409);
        }

        // لو الطلب انلغى هلأ: نرجّع الكميات للمخزون
        if ($status === 'Cancelled' && $oldStatus !== 'Cancelled') {
            q($db, 'UPDATE products p JOIN order_items i ON i.product_id = p.id
                    SET p.stock = p.stock + i.quantity WHERE i.order_id = ?', [$id]);
        }

        q($db, 'UPDATE orders SET status = ?, payment_status = ? WHERE id = ?', [$status, $pay, $id]);
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        throw $e;
    }

    log_activity($db, 'order.update', "#$id → $status / $pay");
    out(['ok' => true]);
}


/* ============================================================
   8) أدمن: المستخدمين
   ============================================================ */

function do_admin_users($db)
{
    need_admin();
    $users = $db->query('SELECT u.id, u.name, u.email, u.role, u.phone, u.profile_image, u.created_at,
        (SELECT COUNT(*) FROM orders WHERE user_id = u.id) orders_count,
        (SELECT COUNT(*) FROM user_images WHERE user_id = u.id) images_count
        FROM users u ORDER BY u.id DESC')->fetchAll();
    out(['items' => $users]);
}

function do_admin_user_images($db)
{
    need_admin();
    $images = q($db, 'SELECT i.id, i.user_id, i.image_path, i.created_at, u.name, u.email
                      FROM user_images i INNER JOIN users u ON u.id = i.user_id
                      WHERE i.user_id = ? ORDER BY i.id DESC', [(int)($_GET['user_id'] ?? 0)])->fetchAll();
    out(['items' => $images]);
}

function do_admin_user_update($db)
{
    post_only();
    need_admin();
    $data = body();

    $id   = (int)($data['id'] ?? 0);
    $role = isset($data['role']) ? (string)$data['role'] : '';

    if (!in_array($role, ['customer', 'admin'], true)) {
        fail('قيمة غير صالحة', 'Invalid value', 422);
    }
    if ($id === (int)Auth::id()) {
        fail('لا يمكنك تغيير دور حسابك', 'You cannot change your own role', 409);
    }

    q($db, 'UPDATE users SET role = ? WHERE id = ?', [$role, $id]);
    log_activity($db, 'user.role', "#$id → $role");
    out(['ok' => true]);
}

function do_admin_user_delete($db)
{
    post_only();
    need_admin();
    $data = body();
    $id = (int)($data['id'] ?? 0);

    if ($id === (int)Auth::id()) {
        fail('لا يمكنك حذف حسابك', 'You cannot delete your own account', 409);
    }
    $ordersCount = (int)q($db, 'SELECT COUNT(*) FROM orders WHERE user_id = ?', [$id])->fetchColumn();
    if ($ordersCount > 0) {
        fail('لا يمكن حذف مستخدم لديه طلبات', 'Cannot delete a user who has orders', 409);
    }

    q($db, 'DELETE FROM users WHERE id = ?', [$id]);
    log_activity($db, 'user.delete', "#$id");
    out(['ok' => true]);
}


/* ============================================================
   9) أدمن: المنتجات
   ============================================================ */

// إضافة أو تعديل: لو في id = تعديل، لو ما في = إضافة
function do_admin_product_save($db)
{
    post_only();
    need_admin();
    $data = body();

    $id       = (int)($data['id'] ?? 0);
    $category = (int)($data['category_id'] ?? 0) ?: null;   // فاضي = null
    $name     = str($data, 'name', 150);
    $desc     = str($data, 'description', 5000) ?: null;
    $price    = isset($data['price']) ? (string)$data['price'] : '';
    $stock    = isset($data['stock']) ? (string)$data['stock'] : '0';
    $artisan  = str($data, 'artisan_name', 100) ?: null;
    $story    = str($data, 'artisan_story', 5000) ?: null;

    if (mb_strlen($name) < 2 || !is_numeric($price) || (float)$price < 0 || !ctype_digit($stock)) {
        fail('تحقق من الاسم والسعر والكمية', 'Check the name, price and stock', 422);
    }

    $newImage = upload_image('products');

    if ($id) {
        // ---- تعديل ----
        $oldImage = q($db, 'SELECT image FROM products WHERE id = ?', [$id])->fetchColumn();
        if ($oldImage === false) {
            fail('المنتج غير موجود', 'Product not found', 404);
        }

        // لو ما في صورة جديدة منبقي القديمة
        $imageToSave = $newImage ? $newImage : $oldImage;

        q($db, 'UPDATE products SET category_id=?, name=?, description=?, price=?, stock=?,
                artisan_name=?, artisan_story=?, image=? WHERE id=?',
            [$category, $name, $desc, $price, (int)$stock, $artisan, $story, $imageToSave, $id]);

        if ($newImage && $oldImage) {
            ImageUploader::delete($oldImage); // نحذف الصورة القديمة من القرص
        }
        log_activity($db, 'product.update', "#$id $name");
    } else {
        // ---- إضافة ----
        q($db, 'INSERT INTO products (category_id, name, description, price, stock, image, artisan_name, artisan_story)
                VALUES (?,?,?,?,?,?,?,?)',
            [$category, $name, $desc, $price, (int)$stock, $newImage, $artisan, $story]);
        $id = (int)$db->lastInsertId();
        log_activity($db, 'product.create', "#$id $name");
    }

    out(['ok' => true, 'id' => $id]);
}

// تغيير صورة المنتج فقط
function do_admin_product_image($db)
{
    post_only();
    need_admin();
    $id = (int)($_POST['id'] ?? 0);

    $oldImage = q($db, 'SELECT image FROM products WHERE id = ?', [$id])->fetchColumn();
    if ($oldImage === false) {
        fail('المنتج غير موجود', 'Product not found', 404);
    }

    $newImage = upload_image('products');
    if (!$newImage) {
        fail('اختر صورة أولاً', 'Choose an image first', 422);
    }

    q($db, 'UPDATE products SET image = ? WHERE id = ?', [$newImage, $id]);
    if ($oldImage) {
        ImageUploader::delete($oldImage);
    }
    log_activity($db, 'product.image', "#$id");
    out(['ok' => true, 'image' => $newImage]);
}

function do_admin_product_delete($db)
{
    post_only();
    need_admin();
    $data = body();
    $id = (int)($data['id'] ?? 0);

    $product = q($db, 'SELECT image, name FROM products WHERE id = ?', [$id])->fetch();
    if (!$product) {
        fail('المنتج غير موجود', 'Product not found', 404);
    }

    q($db, 'DELETE FROM products WHERE id = ?', [$id]);
    ImageUploader::delete($product['image']);
    log_activity($db, 'product.delete', "#$id {$product['name']}");
    out(['ok' => true]);
}


/* ============================================================
   10) أدمن: التصنيفات
   ============================================================ */

// إضافة أو تعديل: لو في id = تعديل، لو ما في = إضافة
function do_admin_category_save($db)
{
    post_only();
    need_admin();
    $data = body();

    $id   = (int)($data['id'] ?? 0);
    $name = str($data, 'name', 100);
    $desc = str($data, 'description', 2000) ?: null;

    if (mb_strlen($name) < 2) {
        fail('اسم التصنيف قصير', 'Category name is too short', 422);
    }

    $newImage = upload_image('categories');

    try {
        if ($id) {
            // ---- تعديل ----
            $oldImage = q($db, 'SELECT image FROM categories WHERE id = ?', [$id])->fetchColumn();
            if ($oldImage === false) {
                fail('التصنيف غير موجود', 'Category not found', 404);
            }
            $imageToSave = $newImage ? $newImage : $oldImage;

            q($db, 'UPDATE categories SET name=?, description=?, image=? WHERE id=?',
                [$name, $desc, $imageToSave, $id]);

            if ($newImage && $oldImage) {
                ImageUploader::delete($oldImage);
            }
            log_activity($db, 'category.update', "#$id $name");
        } else {
            // ---- إضافة ----
            q($db, 'INSERT INTO categories (name, description, image) VALUES (?,?,?)',
                [$name, $desc, $newImage]);
            $id = (int)$db->lastInsertId();
            log_activity($db, 'category.create', "#$id $name");
        }
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') { // الاسم مكرر
            fail('اسم التصنيف مستخدم مسبقاً', 'This category name already exists', 409);
        }
        throw $e;
    }

    out(['ok' => true, 'id' => $id]);
}

function do_admin_category_delete($db)
{
    post_only();
    need_admin();
    $data = body();
    $id = (int)($data['id'] ?? 0);

    $productsCount = (int)q($db, 'SELECT COUNT(*) FROM products WHERE category_id = ?', [$id])->fetchColumn();
    if ($productsCount > 0) {
        fail('لا يمكن حذف تصنيف يحتوي منتجات', 'Cannot delete a category that has products', 409);
    }

    $image = q($db, 'SELECT image FROM categories WHERE id = ?', [$id])->fetchColumn();
    q($db, 'DELETE FROM categories WHERE id = ?', [$id]);
    if ($image) {
        ImageUploader::delete($image);
    }
    log_activity($db, 'category.delete', "#$id");
    out(['ok' => true]);
}


/* ============================================================
   11) أدمن: الحرفيين والسجل
   ============================================================ */

// ما في جدول للحرفيين، فبنجمعهم من المنتجات
function do_admin_artisans($db)
{
    need_admin();
    $artisans = $db->query("SELECT artisan_name, MAX(artisan_story) artisan_story, COUNT(*) products_count
        FROM products
        WHERE artisan_name IS NOT NULL AND artisan_name <> ''
        GROUP BY artisan_name ORDER BY artisan_name")->fetchAll();
    out(['items' => $artisans]);
}

// آخر 200 عملية
function do_admin_logs($db)
{
    need_admin();
    $logs = $db->query('SELECT l.id, l.action, l.details, l.created_at, u.name user_name
        FROM activity_logs l LEFT JOIN users u ON u.id = l.user_id
        ORDER BY l.id DESC LIMIT 200')->fetchAll();
    out(['items' => $logs]);
}


/* ============================================================
   12) التشغيل: نقرأ action ونستدعي الدالة المناسبة
   ============================================================ */

$db = Database::connect();
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        // عام
        case 'health':     do_health();        break;
        case 'products':   do_products($db);   break;
        case 'product':    do_product($db);    break;
        case 'categories': do_categories($db); break;
        case 'img':        do_img($db);        break;

        // الحساب
        case 'register':          do_register();             break;
        case 'login':             do_login();                break;
        case 'logout':            do_logout();               break;
        case 'me':                do_me();                   break;
        case 'profile':           do_profile();              break;
        case 'my-images':         do_my_images();            break;
        case 'user-image-upload': do_user_image_upload($db); break;
        case 'profile-image':     do_profile_image($db);     break;
        case 'change-password':   do_change_password($db);   break;

        // إعداد أول أدمن
        case 'setup-status': do_setup_status($db); break;
        case 'setup-admin':  do_setup_admin($db);  break;

        // السلة
        case 'cart':        do_cart();           break;
        case 'cart-add':    do_cart_add();       break;
        case 'cart-update': do_cart_update($db); break;
        case 'cart-remove': do_cart_remove();    break;

        // الطلبات
        case 'orders-create': do_orders_create($db); break;
        case 'my-orders':     do_my_orders($db);     break;
        case 'order':         do_order($db);         break;

        // أدمن
        case 'admin-stats':           do_admin_stats($db);           break;
        case 'admin-orders':          do_admin_orders($db);          break;
        case 'admin-order':           do_admin_order($db);           break;
        case 'admin-order-update':    do_admin_order_update($db);    break;
        case 'admin-users':           do_admin_users($db);           break;
        case 'admin-user-images':     do_admin_user_images($db);     break;
        case 'admin-user-update':     do_admin_user_update($db);     break;
        case 'admin-user-delete':     do_admin_user_delete($db);     break;
        case 'admin-product-save':    do_admin_product_save($db);    break;
        case 'admin-product-image':   do_admin_product_image($db);   break;
        case 'admin-product-delete':  do_admin_product_delete($db);  break;
        case 'admin-category-save':   do_admin_category_save($db);   break;
        case 'admin-category-delete': do_admin_category_delete($db); break;
        case 'admin-artisans':        do_admin_artisans($db);        break;
        case 'admin-logs':            do_admin_logs($db);            break;

        default:
            fail('عملية غير معروفة', 'Unknown API action', 404);
    }
} catch (Throwable $e) {
    error_log($e); // خطأ غير متوقع: نسجله ونرجّع رسالة عامة
    fail('حدث خطأ في الخادم', 'Server error', 500);
}