<?php
/** دوال مساعدة عامة */


/* =====================================================================
 * عرض وروابط
 * ===================================================================== */

/** تنظيف النص قبل عرضه بالصفحة (حماية من XSS) */
function e($v): string
{
    return htmlspecialchars((string)$v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** رابط داخلي مع مسار المشروع (BASE_URL) */
function url(string $path = ''): string
{
    return BASE_URL . '/' . ltrim($path, '/');
}

/** تحويل لصفحة ثانية وإنهاء التنفيذ */
function redirect(string $path): void
{
    header('Location: ' . url($path));
    exit;
}

/** عرض السعر بالشيكل، مثلاً: 25.00 ₪ */
function money($n): string
{
    return number_format((float)$n, 2) . ' ₪';
}

/** رابط الصورة، أو صورة بديلة لو ما في صورة */
function img_url(?string $path): string
{
    return $path ? url($path) : url('assets/placeholder.svg');
}


/* =====================================================================
 * CSRF (حماية الفورمات من الطلبات المزوّرة)
 * ===================================================================== */

/** توكن عشوائي مخزّن بالجلسة (بينعمل مرة وحدة) */
function csrf_token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

/** حقل مخفي بنحطه داخل كل فورم POST */
function csrf_field(): string
{
    return '<input type="hidden" name="csrf" value="' . csrf_token() . '">';
}

/** نتحقق من التوكن عند استقبال الفورم، وإلا نرفض الطلب */
function csrf_check(): void
{
    if (!hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) {
        http_response_code(419);
        exit('طلب غير صالح (CSRF).');
    }
}


/* =====================================================================
 * رسائل فلاش (تظهر مرة وحدة بعد التحويل)
 * ===================================================================== */

/** نخزّن رسالة (النوع مثلاً: success أو error) */
function flash(string $type, string $msg): void
{
    $_SESSION['flash'][] = ['t' => $type, 'm' => $msg];
}

/** نعرض كل الرسائل المخزّنة ثم نمسحها */
function flash_render(): string
{
    $html = '';
    foreach ($_SESSION['flash'] ?? [] as $f) {
        $html .= '<div class="alert alert-' . e($f['t']) . '">' . e($f['m']) . '</div>';
    }
    unset($_SESSION['flash']);
    return $html;
}


/* =====================================================================
 * مدخلات
 * ===================================================================== */

/** قيمة من POST بعد إزالة الفراغات (فاضية لو مش موجودة) */
function post(string $key): string
{
    return trim((string)($_POST[$key] ?? ''));
}


/* =====================================================================
 * الحالات المسموحة (المفتاح بالإنجليزي للداتابيس، والقيمة للعرض بالعربي)
 * ===================================================================== */

const ORDER_STATUSES = [
    'Pending'    => 'قيد الانتظار',
    'Processing' => 'قيد التجهيز',
    'Shipped'    => 'تم الشحن',
    'Delivered'  => 'تم التسليم',
    'Cancelled'  => 'ملغي',
];

const PAYMENT_STATUSES = [
    'Unpaid' => 'غير مدفوع',
    'Paid'   => 'مدفوع',
];