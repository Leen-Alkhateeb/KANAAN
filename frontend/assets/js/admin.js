(() => {
'use strict';

/* =====================================================================
   KANAAN Admin — صفحة واحدة بدون إعادة تحميل، عربي / إنجليزي
   كل الشاشات بتقرأ وتكتب بالداتابيس عن طريق api.php
===================================================================== */


/* =====================================================================
   1) الإعدادات والدوال الصغيرة
===================================================================== */

const BASE = new URL('../../', document.currentScript.src).href;   // .../frontend/
const API  = BASE + 'api.php';
const PH   = BASE + 'assets/images/placeholder.svg';                // صورة بديلة

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// حفظ اللغة بالمتصفح (try/catch لأن المتصفح ممكن يمنع localStorage)
const store = {
    get: k => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }
};

// الحالة العامة: اللغة والمستخدم الحالي
const S = { lang: store.get('kn_lang') === 'en' ? 'en' : 'ar', user: null };

const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];


/* =====================================================================
   2) النصوص (عربي / إنجليزي)  —  المفتاح: [عربي, English]
===================================================================== */

const D = {
    /* عام */
    brandSub: ['لوحة الإدارة', 'Admin panel'],
    mMain: ['القائمة الرئيسية', 'Main menu'], mContent: ['إدارة المحتوى', 'Content'],
    toStore: ['العودة للمتجر', 'Back to store'], viewStore: ['عرض المتجر', 'View store'],
    langTo: ['EN', 'عربي'], logout: ['تسجيل الخروج', 'Sign out'], loading: ['جاري التحميل...', 'Loading...'],
    save: ['حفظ', 'Save'], cancel: ['إلغاء', 'Cancel'], edit: ['تعديل', 'Edit'], del: ['حذف', 'Delete'],
    view: ['عرض', 'View'], add: ['إضافة', 'Add'], close: ['إغلاق', 'Close'],
    none: ['لا توجد بيانات', 'No data yet'], all: ['الكل', 'All'],
    saved: ['تم الحفظ', 'Saved'], deleted: ['تم الحذف', 'Deleted'],
    delTitle: ['تأكيد الحذف', 'Confirm deletion'],
    sure: ['هل أنت متأكد من الحذف؟', 'Are you sure you want to delete this?'],
    errGen: ['تعذّر إتمام العملية', 'The action could not be completed'],
    errSrv: ['تعذّر قراءة رد الخادم. تأكد من تشغيل Apache و PHP.', 'Unable to read the server response. Make sure Apache and PHP are running.'],

    /* القائمة الجانبية */
    nDash: ['نظرة عامة', 'Overview'], nProducts: ['المنتجات', 'Products'], nCats: ['التصنيفات', 'Categories'],
    nOrders: ['الطلبات', 'Orders'], nUsers: ['المستخدمون', 'Users'], nArtisans: ['الحرفيون', 'Artisans'],
    nImages: ['صور المنتجات', 'Product images'], nLogs: ['سجل النشاطات', 'Activity log'],

    /* عناوين الصفحات */
    t_dashboard: ['لوحة التحكم', 'Dashboard'], t_products: ['إدارة المنتجات', 'Manage products'],
    t_add: ['إضافة منتج', 'Add product'], t_edit: ['تعديل منتج', 'Edit product'],
    t_categories: ['التصنيفات', 'Categories'], t_orders: ['الطلبات', 'Orders'], t_users: ['المستخدمون', 'Users'],
    t_artisans: ['الحرفيون', 'Artisans'], t_images: ['صور المنتجات', 'Product images'], t_logs: ['سجل النشاطات', 'Activity log'],

    /* تسجيل الدخول وإعداد أول أدمن */
    gLogin: ['دخول الإدارة', 'Admin sign in'], gSetup: ['إعداد الحساب الأول', 'First-time setup'],
    gSetupP: ['لا يوجد أدمن بعد. أنشئ حساب المدير الأول لتبدأ.', 'There is no admin yet. Create the first admin account to get started.'],
    gLoginP: ['سجّل دخولك بحساب مدير.', 'Sign in with an admin account.'],
    gName: ['الاسم', 'Name'], gEmail: ['البريد الإلكتروني', 'Email'], gPass: ['كلمة المرور (8+ أحرف)', 'Password (8+ characters)'],
    gCreate: ['إنشاء حساب المدير', 'Create admin account'], gGo: ['دخول', 'Sign in'],
    gNotAdmin: ['هذا الحساب ليس مديراً.', 'This account is not an admin.'],
    pwBtn: ['تغيير كلمة المرور', 'Change password'], pwCur: ['كلمة المرور الحالية', 'Current password'],
    pwNew: ['كلمة المرور الجديدة (8+ أحرف)', 'New password (8+ characters)'], pwOk: ['تم تغيير كلمة المرور', 'Password changed'],

    /* لوحة التحكم */
    sProducts: ['المنتجات', 'Products'], sCats: ['التصنيفات', 'Categories'], sOrders: ['الطلبات', 'Orders'], sUsers: ['المستخدمون', 'Users'],
    sPending: ['طلبات قيد الانتظار', 'Pending orders'], sRevenue: ['إجمالي المبيعات', 'Total sales'],
    dRecent: ['أحدث الطلبات', 'Latest orders'], dLow: ['مخزون منخفض', 'Low stock'],
    dAllOk: ['كل المنتجات بمخزون جيد', 'All products are well stocked'], pcs: ['قطعة', 'pcs'],
    dChart: ['المبيعات خلال آخر 6 أشهر', 'Revenue over the last 6 months'],
    dChartNote: ['حسب الطلبات غير الملغاة', 'Excluding cancelled orders'],

    /* الطلبات */
    oNo: ['رقم', 'No.'], oCust: ['العميل', 'Customer'], oPhone: ['الهاتف', 'Phone'], oCity: ['المدينة', 'City'],
    oTotal: ['الإجمالي', 'Total'], oStatus: ['الحالة', 'Status'], oPay: ['الدفع', 'Payment'], oDate: ['التاريخ', 'Date'],
    oItems: ['القطع', 'Items'], oAddr: ['العنوان', 'Address'], oNotes: ['ملاحظات', 'Notes'], oEmail: ['البريد', 'Email'],
    oDetail: ['تفاصيل الطلب', 'Order details'], oQty: ['الكمية', 'Qty'], oLines: ['المنتجات', 'Products'],
    oCancelWarn: ['عند الإلغاء تعود الكميات إلى المخزون ولا يمكن إعادة فتح الطلب.', 'Cancelling returns the stock and the order cannot be reopened.'],
    stPending: ['قيد الانتظار', 'Pending'], stProcessing: ['قيد التجهيز', 'Processing'], stShipped: ['تم الشحن', 'Shipped'],
    stDelivered: ['تم التسليم', 'Delivered'], stCancelled: ['ملغي', 'Cancelled'],
    payUnpaid: ['غير مدفوع', 'Unpaid'], payPaid: ['مدفوع', 'Paid'],

    /* المنتجات */
    pName: ['الاسم', 'Name'], pCat: ['التصنيف', 'Category'], pPrice: ['السعر', 'Price'], pStock: ['الكمية', 'Stock'],
    pDesc: ['الوصف', 'Description'], pArt: ['اسم الحرفي', 'Artisan name'], pStory: ['نبذة عن الحرفي', 'Artisan story'],
    pImage: ['الصورة', 'Image'], pNoCat: ['بدون تصنيف', 'No category'],
    pSearch: ['ابحث في المنتجات...', 'Search products...'], pAdd: ['+ إضافة منتج', '+ Add product'],
    pHint: ['JPG أو PNG أو WEBP — حتى 2MB', 'JPG, PNG or WEBP — up to 2MB'],

    /* التصنيفات */
    cName: ['اسم التصنيف', 'Category name'], cDesc: ['الوصف', 'Description'],
    cNew: ['تصنيف جديد', 'New category'], cEdit: ['تعديل التصنيف', 'Edit category'], cProducts: ['المنتجات', 'Products'],

    /* المستخدمين */
    uName: ['الاسم', 'Name'], uEmail: ['البريد', 'Email'], uRole: ['الدور', 'Role'], uOrders: ['الطلبات', 'Orders'],
    uJoined: ['التسجيل', 'Joined'], uPhotos: ['صور الحساب', 'Account photos'],
    uPhotosTitle: ['صور حساب المستخدم', 'User account photos'],
    uNoPhotos: ['هذا المستخدم لم يرفع صوراً بعد.', 'This user has not uploaded any photos yet.'],
    roleAdmin: ['مدير', 'Admin'], roleCustomer: ['عميل', 'Customer'],

    /* الحرفيين / صور المنتجات / السجل */
    aProductsN: ['منتجات', 'products'], aHint: ['يتم تعديل بيانات الحرفي من صفحة المنتج.', 'Artisan details are edited from the product page.'],
    iUpload: ['رفع صورة', 'Upload image'], iDone: ['تم تحديث الصورة', 'Image updated'],
    lWhen: ['الوقت', 'Time'], lUser: ['المستخدم', 'User'], lAction: ['العملية', 'Action'], lDetails: ['التفاصيل', 'Details'],
    'a_admin.setup': ['إعداد الأدمن', 'Admin setup'], 'a_order.create': ['طلب جديد', 'New order'],
    'a_order.update': ['تحديث طلب', 'Order updated'], 'a_user.role': ['تغيير دور', 'Role changed'],
    'a_user.delete': ['حذف مستخدم', 'User deleted'], 'a_product.create': ['إضافة منتج', 'Product created'],
    'a_product.update': ['تعديل منتج', 'Product updated'], 'a_product.image': ['تحديث صورة', 'Image updated'],
    'a_product.delete': ['حذف منتج', 'Product deleted'], 'a_category.create': ['إضافة تصنيف', 'Category created'],
    'a_category.update': ['تعديل تصنيف', 'Category updated'], 'a_category.delete': ['حذف تصنيف', 'Category deleted']
};

// جلب النص حسب اللغة الحالية
const t = k => { const d = D[k]; return d ? d[S.lang === 'ar' ? 0 : 1] : k; };


/* =====================================================================
   3) دوال العرض (تنسيق)
===================================================================== */

// حماية من XSS: نحوّل الرموز الخاصة قبل ما نعرض أي نص
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const nf    = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = n => S.lang === 'ar' ? nf.format(+n || 0) + ' د.أ' : 'JOD ' + nf.format(+n || 0);
const fdt   = s => new Date(String(s).replace(' ', 'T')).toLocaleString(S.lang === 'ar' ? 'ar-JO-u-nu-latn' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });

// رابط الصورة: صور السيرفر بتمر عن طريق الأكشن img، وإذا فشلت بنعرض الصورة البديلة
const imgSrc = p => !p ? PH : (/^(https?:|data:)/.test(p) ? p : API + '?action=img&path=' + encodeURIComponent(p));
const img    = (p, alt = '') => `<img src="${esc(imgSrc(p))}" alt="${esc(alt)}" loading="lazy" onerror="this.onerror=null;this.src='${PH}'">`;

const chip = st => `<span class="a-chip st-${esc(st)}">${t('st' + st)}</span>`;

// جدول جاهز: head = عناوين الأعمدة، rows = صفوف HTML
const tbl = (head, rows) => `<div class="a-table"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${head.length}" class="a-empty">${t('none')}</td></tr>`}</tbody></table></div>`;

// صندوق بعنوان (panel)
const panel = (h, body, extra = '') => `<section class="a-panel"><div class="a-panel-head"><h2>${h}</h2>${extra}</div>${body}</section>`;


/* =====================================================================
   4) الاتصال بالـ API
===================================================================== */

// api('اسم_الأكشن', {بارامترات الرابط}, body)
//  - بدون body = GET
//  - body كائن عادي = JSON، و FormData = رفع ملفات
async function api(action, params = {}, body) {
    const u = new URL(API);
    u.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => { if (v !== '' && v != null) u.searchParams.set(k, v); });

    const o = { credentials: 'same-origin' };
    if (body instanceof FormData) {
        o.method = 'POST';
        o.body = body;
    } else if (body) {
        o.method = 'POST';
        o.headers = { 'Content-Type': 'application/json' };
        o.body = JSON.stringify(body);
    }

    const r = await fetch(u, o);
    let d;
    try { d = await r.json(); } catch { throw Error(t('errSrv')); }
    if (!r.ok) throw Error((S.lang === 'en' && d.error_en) || d.error || t('errGen'));
    return d;
}


/* =====================================================================
   5) النوافذ: رسالة صغيرة (toast) + نافذة عامة (modal) + نافذة تأكيد الحذف
===================================================================== */

// رسالة صغيرة تظهر تحت وتختفي لحالها
function toast(msg, bad) {
    let el = $('#a-toast');
    if (!el) { el = document.createElement('div'); el.id = 'a-toast'; document.body.appendChild(el); }
    el.textContent = msg;
    el.className = 'show' + (bad ? ' bad' : '');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => { el.className = ''; }, 2800);
}

// نافذة منبثقة عامة (تفاصيل الطلب، صور المستخدم، تغيير الباسورد)
function modal(html) {
    const m = document.createElement('div');
    m.className = 'a-modal';
    m.innerHTML = `<div class="a-modal-box" role="dialog" aria-modal="true"><button class="a-x" type="button" aria-label="${t('close')}">×</button>${html}</div>`;

    const close = () => { m.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape') close(); };

    m.addEventListener('click', e => { if (e.target === m || e.target.closest('.a-x')) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(m);
    m.close = close;
    return m;
}

// نافذة تأكيد الحذف: بترجّع true لو ضغط "حذف"، و false لو ألغى (زر إلغاء / Esc / ضغط برا)
function confirmBox(name = '') {
    return new Promise(resolve => {
        const o = document.createElement('div');
        o.className = 'a-confirm-overlay';
        o.innerHTML = `
            <div class="a-confirm-box" role="alertdialog" aria-modal="true">
                <div class="a-confirm-icon">🗑</div>
                <h3>${t('delTitle')}</h3>
                <p>${t('sure')}${name ? `<br><b>${esc(name)}</b>` : ''}</p>
                <div class="a-confirm-actions">
                    <button class="a-confirm-cancel" type="button">${t('cancel')}</button>
                    <button class="a-confirm-delete" type="button">${t('del')}</button>
                </div>
            </div>`;

        const done = ok => { o.remove(); document.removeEventListener('keydown', onKey); resolve(ok); };
        const onKey = e => { if (e.key === 'Escape') done(false); };

        o.addEventListener('click', e => {
            if (e.target === o || e.target.closest('.a-confirm-cancel')) done(false);
            else if (e.target.closest('.a-confirm-delete')) done(true);
        });
        document.addEventListener('keydown', onKey);
        document.body.appendChild(o);
        $('.a-confirm-cancel', o).focus();   // الفوكس على "إلغاء" عشان ما يتحذف بالغلط
    });
}

// حذف عنصر بعد التأكيد: منتج / تصنيف / مستخدم
async function askDelete(action, id, name) {
    if (!(await confirmBox(name))) return;
    try {
        await api(action, {}, { id });
        toast(t('deleted'));
        view(true);   // إعادة تحميل الصفحة الحالية بدون وميض
    } catch (x) { toast(x.message, true); }
}

// نجهّز FormData من فورم: نشيل حقل الصورة لو فاضي، ونضيف id لو تعديل
function formData(form, id) {
    const fd = new FormData(form);
    const file = fd.get('image');
    if (!file || !file.name) fd.delete('image');
    if (id) fd.append('id', id);
    return fd;
}

// نافذة تغيير كلمة المرور
function pwModal() {
    const m = modal(`
        <h2>${t('pwBtn')}</h2>
        <form id="pw-form">
            <label class="a-f"><span>${t('pwCur')}</span><input name="current" type="password" required autocomplete="current-password"></label>
            <label class="a-f"><span>${t('pwNew')}</span><input name="password" type="password" required minlength="8" autocomplete="new-password"></label>
            <div class="a-msg" id="pw-msg" role="alert"></div>
            <button class="a-btn a-btn-primary" type="submit">${t('save')}</button>
        </form>`);

    $('#pw-form', m).onsubmit = async e => {
        e.preventDefault();
        try {
            await api('change-password', {}, Object.fromEntries(new FormData(e.target)));
            toast(t('pwOk'));
            m.close();
        } catch (x) { $('#pw-msg', m).textContent = x.message; }
    };
}


/* =====================================================================
   6) التنقل بين الصفحات (History API)
===================================================================== */

// اسم ملف الصفحة => اسم الشاشة
const ROUTES = {
    'dashboard.html': 'dashboard', 'products.html': 'products', 'add-product.html': 'add', 'edit-product.html': 'edit',
    'categories.html': 'categories', 'orders.html': 'orders', 'users.html': 'users', 'artisans.html': 'artisans',
    'product-images.html': 'images', 'activity-logs.html': 'logs'
};

// عناصر القائمة الجانبية: [مفتاح, ملف, نص, أيقونة] — والعناصر اللي بدون ملف هي عناوين أقسام
const NAV = [
    ['main', null],
    ['dashboard', 'dashboard.html', 'nDash', '▦'], ['products', 'products.html', 'nProducts', '◇'],
    ['categories', 'categories.html', 'nCats', '▤'], ['orders', 'orders.html', 'nOrders', '▣'], ['users', 'users.html', 'nUsers', '♙'],
    ['content', null],
    ['artisans', 'artisans.html', 'nArtisans', '✿'], ['images', 'product-images.html', 'nImages', '▧'], ['logs', 'activity-logs.html', 'nLogs', '◷']
];

const adminPath = new URL(BASE + 'admin/').pathname;
const routeOf = url => url.pathname.startsWith(adminPath) ? ROUTES[url.pathname.slice(adminPath.length).toLowerCase()] : null;
const A  = f => BASE + 'admin/' + f;                           // رابط صفحة أدمن
const go = url => { history.pushState(null, '', url); view(); };  // انتقال بدون تحميل الصفحة


/* =====================================================================
   7) الهيكل العام: لوحة التحكم + شاشة الدخول
===================================================================== */

const root = () => $('#admin-root');

// نضبط لغة واتجاه الصفحة
function setDir() {
    document.documentElement.lang = S.lang;
    document.documentElement.dir = S.lang === 'ar' ? 'rtl' : 'ltr';
}

// الهيكل: القائمة الجانبية + الهيدر + مكان المحتوى
function layout() {
    setDir();
    const mark = S.lang === 'ar' ? 'ك' : 'K';
    root().innerHTML = `
    <div class="admin-shell">
        <aside class="admin-sidebar" id="a-sb">
            <a class="brand" href="${A('dashboard.html')}"><span class="brand-mark">${mark}</span><span><b>KANAAN</b><small>${t('brandSub')}</small></span></a>
            <div class="admin-profile"><div class="avatar">${esc(String(S.user.name).slice(0, 1).toUpperCase())}</div><div><b>${esc(S.user.name)}</b><small>${t('roleAdmin')}</small></div></div>
            ${NAV.map(n => n[1]
                ? `<a class="side-link" data-k="${n[0]}" href="${A(n[1])}"><span class="si">${n[3]}</span>${t(n[2])}</a>`
                : `<span class="side-label">${t(n[0] === 'main' ? 'mMain' : 'mContent')}</span>`).join('')}
            <a class="side-link side-back" href="${BASE}index.html">↩　${t('toStore')}</a>
        </aside>
        <main class="admin-main">
            <header class="admin-top">
                <button class="a-burger" id="a-burger" type="button" aria-label="menu">☰</button>
                <div><span class="eyebrow">KANAAN / ADMIN</span><h1 id="a-title"></h1></div>
                <div class="a-tools">
                    <button class="a-btn a-btn-light" id="a-lang" type="button">${t('langTo')}</button>
                    <a class="a-btn a-btn-light" href="${BASE}index.html" target="_blank" rel="noopener">${t('viewStore')} ↗</a>
                    <button class="a-btn a-btn-light" id="a-pw" type="button">${t('pwBtn')}</button>
                    <button class="a-btn a-btn-light" id="a-out" type="button">${t('logout')}</button>
                </div>
            </header>
            <div id="a-view"><div class="a-loading">${t('loading')}</div></div>
        </main>
    </div>`;
}

// شاشة الدخول (أو إعداد أول أدمن لو setup = true)
function gate(setup) {
    setDir();
    const mark = S.lang === 'ar' ? 'ك' : 'K';
    root().innerHTML = `
    <div class="a-gate"><form class="a-gate-card" id="a-gate">
        <button class="a-btn a-btn-light a-gate-lang" id="a-lang" type="button">${t('langTo')}</button>
        <a class="brand" href="${BASE}index.html"><span class="brand-mark">${mark}</span><span><b>KANAAN</b><small>${t('brandSub')}</small></span></a>
        <h1>${setup ? t('gSetup') : t('gLogin')}</h1>
        <p>${setup ? t('gSetupP') : t('gLoginP')}</p>
        ${setup ? `<label class="a-f"><span>${t('gName')}</span><input name="name" required minlength="3"></label>` : ''}
        <label class="a-f"><span>${t('gEmail')}</span><input name="email" type="email" required autocomplete="email"></label>
        <label class="a-f"><span>${t('gPass')}</span><input name="password" type="password" required minlength="${setup ? 8 : 1}" autocomplete="${setup ? 'new-password' : 'current-password'}"></label>
        <div class="a-msg" id="a-msg" role="alert"></div>
        <button class="a-btn a-btn-primary a-block" type="submit">${setup ? t('gCreate') : t('gGo')}</button>
    </form></div>`;

    $('#a-gate').onsubmit = async e => {
        e.preventDefault();
        try {
            await api(setup ? 'setup-admin' : 'login', {}, Object.fromEntries(new FormData(e.target)));
            await boot();
        } catch (x) { $('#a-msg').textContent = x.message; }
    };
}


/* =====================================================================
   8) الشاشات (Views)
   كل شاشة بترجّع نص HTML، أو كائن { html, bind } حيث bind بيربط الأزرار بعد العرض
===================================================================== */

/* ---------- لوحة التحكم ---------- */
async function vDashboard() {
    const g = await api('admin-stats');

    // بطاقات الأرقام: [نص, قيمة, صفحة]
    const stats = [
        ['sProducts', g.products, 'products.html'], ['sCats', g.categories, 'categories.html'], ['sOrders', g.orders, 'orders.html'],
        ['sUsers', g.users, 'users.html'], ['sPending', g.pending, 'orders.html?status=Pending'], ['sRevenue', money(g.revenue), 'orders.html']
    ];

    // الرسم البياني: ارتفاع كل عمود نسبة لأعلى شهر
    const monthly = g.monthly || [];
    const max = Math.max(1, ...monthly.map(m => +m.revenue));
    const bars = monthly.map(m => `
        <div class="a-bar-col">
            <div class="a-bar-value">${money(m.revenue)}</div>
            <div class="a-bar-track"><i style="height:${Math.max(4, (+m.revenue / max) * 100)}%"></i></div>
            <small>${esc(m.month)}</small>
        </div>`).join('');

    const recent = g.recent.map(o => `<tr><td>#${o.id}</td><td>${esc(o.full_name)}</td><td>${money(o.total)}</td><td>${chip(o.status)}</td><td>${fdt(o.created_at)}</td></tr>`).join('');
    const low = g.low_stock.length
        ? `<ul class="a-list">${g.low_stock.map(p => `<li><a href="${A('edit-product.html?id=' + p.id)}">${esc(p.name)}</a><b class="${p.stock < 1 ? 'bad' : ''}">${p.stock} ${t('pcs')}</b></li>`).join('')}</ul>`
        : `<p class="a-empty">${t('dAllOk')}</p>`;

    return `
    <div class="a-stats">${stats.map(s => `<a class="a-stat" href="${A(s[2])}"><small>${t(s[0])}</small><strong>${s[1]}</strong></a>`).join('')}</div>

    <div class="a-chart-panel">
        <div class="a-chart-head"><h3>${t('dChart')}</h3><span>${t('dChartNote')}</span></div>
        <div class="a-bars">${bars || `<p class="a-empty">${t('none')}</p>`}</div>
    </div>

    <div class="a-cols">
        ${panel(t('dRecent'), tbl([t('oNo'), t('oCust'), t('oTotal'), t('oStatus'), t('oDate')], recent),
            `<a class="a-link" href="${A('orders.html')}">${t('nOrders')} →</a>`)}
        ${panel(t('dLow'), low)}
    </div>`;
}

/* ---------- الطلبات ---------- */
async function vOrders(q) {
    const st = q.get('status') || '';
    const rows = (await api('admin-orders', { status: st })).items;

    // أزرار فلترة الحالة
    const pill = k => `<a class="a-pill ${st === k ? 'active' : ''}" href="${A('orders.html' + (k ? '?status=' + k : ''))}">${k ? t('st' + k) : t('all')}</a>`;

    const head = [t('oNo'), t('oCust'), t('oPhone'), t('oCity'), t('oItems'), t('oTotal'), t('oStatus'), t('oPay'), t('oDate'), ''];
    const body = rows.map(o => `
        <tr><td>#${o.id}</td><td>${esc(o.full_name)}</td><td dir="ltr">${esc(o.phone)}</td><td>${esc(o.city)}</td><td>${o.items_count}</td>
            <td>${money(o.total)}</td><td>${chip(o.status)}</td><td>${t('pay' + o.payment_status)}</td><td>${fdt(o.created_at)}</td>
            <td><button class="a-btn a-btn-sm" data-order="${o.id}" type="button">${t('view')}</button></td></tr>`).join('');

    return {
        html: `<div class="a-pills">${pill('')}${STATUSES.map(pill).join('')}</div>${panel(t('nOrders') + ` (${rows.length})`, tbl(head, body))}`,
        bind() { $$('[data-order]').forEach(b => b.onclick = () => orderModal(+b.dataset.order)); }
    };
}

// نافذة تفاصيل الطلب + تغيير الحالة والدفع
async function orderModal(id) {
    let o;
    try { o = (await api('admin-order', { id })).order; }
    catch (e) { return toast(e.message, true); }

    const closed = o.status === 'Cancelled';   // الطلب الملغي ما بنغيّر حالته
    const select = (name, opts, cur, lock) =>
        `<select name="${name}" ${lock ? 'disabled' : ''}>${opts.map(v => `<option value="${v}" ${v === cur ? 'selected' : ''}>${t((name === 'status' ? 'st' : 'pay') + v)}</option>`).join('')}</select>`;

    const lines = o.items.map(i => `<tr><td>${esc(i.product_name)}</td><td>${money(i.unit_price)}</td><td>${i.quantity}</td><td>${money(i.unit_price * i.quantity)}</td></tr>`).join('');

    const m = modal(`
        <h2>${t('oDetail')} #${o.id}</h2>
        <dl class="a-dl">
            <div><dt>${t('oCust')}</dt><dd>${esc(o.full_name)}</dd></div>
            <div><dt>${t('oPhone')}</dt><dd dir="ltr">${esc(o.phone)}</dd></div>
            <div><dt>${t('oEmail')}</dt><dd>${esc(o.email || '—')}</dd></div>
            <div><dt>${t('oDate')}</dt><dd>${fdt(o.created_at)}</dd></div>
            <div class="wide"><dt>${t('oAddr')}</dt><dd>${esc(o.city)}, ${esc(o.address)}</dd></div>
            ${o.notes ? `<div class="wide"><dt>${t('oNotes')}</dt><dd>${esc(o.notes)}</dd></div>` : ''}
        </dl>
        ${tbl([t('oLines'), t('pPrice'), t('oQty'), t('oTotal')], lines)}
        <div class="a-sum"><span>${t('oTotal')}</span><b>${money(o.total)}</b></div>
        <form id="o-form" class="a-row">
            <label class="a-f"><span>${t('oStatus')}</span>${select('status', STATUSES, o.status, closed)}</label>
            <label class="a-f"><span>${t('oPay')}</span>${select('payment_status', ['Unpaid', 'Paid'], o.payment_status, false)}</label>
            <button class="a-btn a-btn-primary" type="submit">${t('save')}</button>
        </form>
        <p class="a-hint">${t('oCancelWarn')}</p>`);

    $('#o-form', m).onsubmit = async e => {
        e.preventDefault();
        const b = Object.fromEntries(new FormData(e.target));
        if (closed) b.status = 'Cancelled';   // الحقل المعطّل ما بينبعت، فنرجّعه يدوياً
        try {
            await api('admin-order-update', {}, { id, ...b });
            toast(t('saved'));
            m.close();
            view(true);
        } catch (x) { toast(x.message, true); }
    };
}

/* ---------- المنتجات (جدول + بحث + حذف) ---------- */
async function vProducts() {
    const items = (await api('products')).items;
    const head = ['', t('pName'), t('pCat'), t('pPrice'), t('pStock'), ''];

    const rows = list => list.map(p => `
        <tr><td class="a-thumb">${img(p.image, p.name)}</td><td><b>${esc(p.name)}</b></td><td>${esc(p.category_name || '—')}</td>
            <td>${money(p.price)}</td><td class="${p.stock < 1 ? 'bad' : ''}">${p.stock}</td>
            <td class="a-acts">
                <a class="a-btn a-btn-sm" href="${A('edit-product.html?id=' + p.id)}">${t('edit')}</a>
                <button class="a-btn a-btn-sm a-btn-del" data-del="${p.id}" type="button">${t('del')}</button>
            </td></tr>`).join('');

    return {
        html: panel(t('nProducts') + ` (${items.length})`,
            `<input class="a-search" id="p-q" type="search" placeholder="${t('pSearch')}"><div id="p-tbl">${tbl(head, rows(items))}</div>`,
            `<a class="a-btn a-btn-primary" href="${A('add-product.html')}">${t('pAdd')}</a>`),
        bind() {
            // البحث بالاسم أو بالتصنيف
            $('#p-q').oninput = () => {
                const q = $('#p-q').value.trim().toLowerCase();
                const list = items.filter(p => !q || p.name.toLowerCase().includes(q) || (p.category_name || '').toLowerCase().includes(q));
                $('#p-tbl').innerHTML = tbl(head, rows(list));
            };
            // الحذف (على الجدول كله لأنه بينرسم من جديد مع البحث)
            $('#p-tbl').onclick = e => {
                const b = e.target.closest('[data-del]');
                if (!b) return;
                const p = items.find(x => x.id == b.dataset.del);
                askDelete('admin-product-delete', +b.dataset.del, p && p.name);
            };
        }
    };
}

/* ---------- إضافة / تعديل منتج ---------- */
async function vProductForm(q, edit) {
    const cats = (await api('categories')).items;
    const p = edit ? (await api('product', { id: q.get('id') })).item : {};

    // حقل إدخال عادي
    const field = (name, label, attrs = '', type = 'text') =>
        `<label class="a-f"><span>${label}</span><input name="${name}" type="${type}" value="${esc(p[name] ?? '')}" ${attrs}></label>`;

    const catOptions = cats.map(c => `<option value="${c.id}" ${String(p.category_id) === String(c.id) ? 'selected' : ''}>${esc(c.name)}</option>`).join('');

    return {
        html: panel(edit ? t('t_edit') : t('t_add'), `
        <form id="p-form" class="a-form">
            ${field('name', t('pName'), 'required minlength="2"')}
            <label class="a-f"><span>${t('pCat')}</span><select name="category_id"><option value="">${t('pNoCat')}</option>${catOptions}</select></label>
            ${field('price', t('pPrice'), 'required min="0" step="0.01"', 'number')}
            ${field('stock', t('pStock'), 'required min="0" step="1"', 'number')}
            <label class="a-f wide"><span>${t('pDesc')}</span><textarea name="description" rows="4">${esc(p.description || '')}</textarea></label>
            ${field('artisan_name', t('pArt'))}
            <label class="a-f wide"><span>${t('pStory')}</span><textarea name="artisan_story" rows="3">${esc(p.artisan_story || '')}</textarea></label>
            <div class="a-f wide"><span>${t('pImage')}</span>
                <div class="a-upload">
                    <div class="a-preview" id="pv">${img(p.image)}</div>
                    <div><input id="p-img" name="image" type="file" accept="image/jpeg,image/png,image/webp"><small>${t('pHint')}</small></div>
                </div>
            </div>
            <div class="a-msg wide" id="p-msg" role="alert"></div>
            <div class="a-actions wide">
                <button class="a-btn a-btn-primary" type="submit">${t('save')}</button>
                <a class="a-btn a-btn-light" href="${A('products.html')}">${t('cancel')}</a>
            </div>
        </form>`),
        bind() {
            // معاينة الصورة قبل الرفع
            $('#p-img').onchange = e => {
                const f = e.target.files[0];
                if (f) $('#pv').innerHTML = `<img src="${URL.createObjectURL(f)}" alt="">`;
            };
            $('#p-form').onsubmit = async e => {
                e.preventDefault();
                try {
                    await api('admin-product-save', {}, formData(e.target, edit && p.id));
                    toast(t('saved'));
                    go(new URL(A('products.html')));
                } catch (x) { $('#p-msg').textContent = x.message; }
            };
        }
    };
}

/* ---------- التصنيفات (فورم + جدول + حذف) ---------- */
async function vCategories(q) {
    const cats  = (await api('categories')).items;
    const prods = (await api('products')).items;
    const count = id => prods.filter(p => p.category_id == id).length;
    const cur   = cats.find(c => c.id == q.get('id')) || {};   // لو في id بالرابط = تعديل

    const rows = cats.map(c => `
        <tr><td class="a-thumb">${img(c.image, c.name)}</td><td><b>${esc(c.name)}</b></td><td>${esc(c.description || '—')}</td><td>${count(c.id)}</td>
            <td class="a-acts">
                <a class="a-btn a-btn-sm" href="${A('categories.html?id=' + c.id)}">${t('edit')}</a>
                <button class="a-btn a-btn-sm a-btn-del" data-del="${c.id}" type="button">${t('del')}</button>
            </td></tr>`).join('');

    return {
        html: `
        ${panel(cur.id ? t('cEdit') : t('cNew'), `
            <form id="c-form" class="a-form">
                <label class="a-f"><span>${t('cName')}</span><input name="name" required minlength="2" value="${esc(cur.name || '')}"></label>
                <label class="a-f"><span>${t('cDesc')}</span><input name="description" value="${esc(cur.description || '')}"></label>
                <div class="a-f wide"><span>${t('pImage')}</span>
                    <div class="a-upload"><div class="a-preview sm">${img(cur.image)}</div><input name="image" type="file" accept="image/jpeg,image/png,image/webp"></div>
                </div>
                <div class="a-msg wide" id="c-msg" role="alert"></div>
                <div class="a-actions wide">
                    <button class="a-btn a-btn-primary" type="submit">${cur.id ? t('save') : t('add')}</button>
                    ${cur.id ? `<a class="a-btn a-btn-light" href="${A('categories.html')}">${t('cancel')}</a>` : ''}
                </div>
            </form>`)}
        ${panel(t('nCats') + ` (${cats.length})`, tbl(['', t('cName'), t('cDesc'), t('cProducts'), ''], rows))}`,
        bind() {
            $('#c-form').onsubmit = async e => {
                e.preventDefault();
                try {
                    await api('admin-category-save', {}, formData(e.target, cur.id));
                    toast(t('saved'));
                    go(new URL(A('categories.html')));
                } catch (x) { $('#c-msg').textContent = x.message; }
            };
            $$('[data-del]').forEach(b => b.onclick = () => {
                const c = cats.find(x => x.id == b.dataset.del);
                askDelete('admin-category-delete', +b.dataset.del, c && c.name);
            });
        }
    };
}

/* ---------- المستخدمين ---------- */
async function vUsers() {
    const rows = (await api('admin-users')).items;
    const head = [t('uName'), t('uEmail'), t('uRole'), t('uOrders'), t('uPhotos'), t('uJoined'), ''];

    const body = rows.map(u => {
        const me = u.id == S.user.id;   // الأدمن ما بيعدّل دوره ولا بيحذف نفسه
        const avatar = u.profile_image ? img(u.profile_image, u.name) : `<span class="a-user-avatar">${esc((u.name || 'K').slice(0, 1))}</span>`;
        return `
        <tr><td><div class="a-user-cell">${avatar}<b>${esc(u.name)}</b></div></td><td dir="ltr">${esc(u.email)}</td>
            <td><select data-role="${u.id}" ${me ? 'disabled' : ''}>
                <option value="customer" ${u.role === 'customer' ? 'selected' : ''}>${t('roleCustomer')}</option>
                <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>${t('roleAdmin')}</option>
            </select></td>
            <td>${u.orders_count}</td>
            <td><button class="a-btn a-btn-sm" data-user-images="${u.id}" type="button">${t('view')} (${u.images_count || 0})</button></td>
            <td>${fdt(u.created_at)}</td>
            <td class="a-acts">${me ? '' : `<button class="a-btn a-btn-sm a-btn-del" data-del="${u.id}" type="button">${t('del')}</button>`}</td></tr>`;
    }).join('');

    return {
        html: panel(t('nUsers') + ` (${rows.length})`, tbl(head, body)),
        bind() {
            // تغيير دور المستخدم
            $$('[data-role]').forEach(s => s.onchange = async () => {
                try { await api('admin-user-update', {}, { id: +s.dataset.role, role: s.value }); toast(t('saved')); }
                catch (x) { toast(x.message, true); view(true); }
            });

            // عرض صور حساب المستخدم
            $$('[data-user-images]').forEach(b => b.onclick = async () => {
                try {
                    const items = (await api('admin-user-images', { user_id: b.dataset.userImages })).items;
                    const html = items.length
                        ? `<div class="a-user-gallery">${items.map(ph => `<figure>${img(ph.image_path, ph.name)}<figcaption>${fdt(ph.created_at)}</figcaption></figure>`).join('')}</div>`
                        : `<p class="a-empty">${t('uNoPhotos')}</p>`;
                    modal(`<h2>${t('uPhotosTitle')}</h2>${html}`);
                } catch (e) { toast(e.message, true); }
            });

            // حذف مستخدم
            $$('[data-del]').forEach(b => b.onclick = () => {
                const u = rows.find(x => x.id == b.dataset.del);
                askDelete('admin-user-delete', +b.dataset.del, u && u.name);
            });
        }
    };
}

/* ---------- الحرفيين ---------- */
async function vArtisans() {
    const rows = (await api('admin-artisans')).items;
    const cards = rows.length
        ? `<div class="a-cards">${rows.map(r => `<article class="a-card"><h3>${esc(r.artisan_name)}</h3><p>${esc(r.artisan_story || '')}</p><small>${r.products_count} ${t('aProductsN')}</small></article>`).join('')}</div>`
        : `<p class="a-empty">${t('none')}</p>`;
    return panel(t('nArtisans') + ` (${rows.length})`, cards) + `<p class="a-hint">${t('aHint')}</p>`;
}

/* ---------- صور المنتجات (تغيير صورة منتج بسرعة) ---------- */
async function vImages() {
    const items = (await api('products')).items;
    const cards = items.map(p => `
        <article class="a-img">
            <div class="a-img-box">${img(p.image, p.name)}</div><b>${esc(p.name)}</b>
            <label class="a-btn a-btn-sm a-btn-light">${t('iUpload')}<input type="file" hidden data-up="${p.id}" accept="image/jpeg,image/png,image/webp"></label>
        </article>`).join('');

    return {
        html: panel(t('nImages'), `<div class="a-imgs">${cards || `<p class="a-empty">${t('none')}</p>`}</div><p class="a-hint">${t('pHint')}</p>`),
        bind() {
            $$('[data-up]').forEach(input => input.onchange = async () => {
                if (!input.files[0]) return;
                const fd = new FormData();
                fd.append('id', input.dataset.up);
                fd.append('image', input.files[0]);
                try { await api('admin-product-image', {}, fd); toast(t('iDone')); view(true); }
                catch (x) { toast(x.message, true); }
            });
        }
    };
}

/* ---------- سجل النشاطات ---------- */
async function vLogs() {
    const rows = (await api('admin-logs')).items;
    const body = rows.map(r => `<tr><td>${fdt(r.created_at)}</td><td>${esc(r.user_name || '—')}</td><td>${esc(D['a_' + r.action] ? t('a_' + r.action) : r.action)}</td><td>${esc(r.details || '')}</td></tr>`).join('');
    return panel(t('nLogs'), tbl([t('lWhen'), t('lUser'), t('lAction'), t('lDetails')], body));
}


/* =====================================================================
   9) عرض الشاشة الحالية حسب الرابط
===================================================================== */

const TITLES = {
    dashboard: 't_dashboard', products: 't_products', add: 't_add', edit: 't_edit', categories: 't_categories',
    orders: 't_orders', users: 't_users', artisans: 't_artisans', images: 't_images', logs: 't_logs'
};

const VIEWS = {
    dashboard: vDashboard, orders: vOrders, products: vProducts,
    add: q => vProductForm(q, false), edit: q => vProductForm(q, true),
    categories: vCategories, users: vUsers, artisans: vArtisans, images: vImages, logs: vLogs
};

// token: لو المستخدم تنقّل بسرعة، نتجاهل نتيجة الصفحة القديمة
let token = 0;

// soft = true: تحديث المحتوى بدون شاشة تحميل (بعد حذف / حفظ)
async function view(soft) {
    const url  = new URL(location.href);
    const page = routeOf(url) || 'dashboard';
    const my   = ++token;

    $('#a-title').textContent = t(TITLES[page]);
    document.title = 'KANAAN Admin | ' + t(TITLES[page]);

    // تمييز الرابط الحالي بالقائمة (إضافة/تعديل منتج = المنتجات)
    const key = page === 'add' || page === 'edit' ? 'products' : page;
    $$('.side-link[data-k]').forEach(a => a.classList.toggle('active', a.dataset.k === key));
    $('#a-sb').classList.remove('open');

    const box = $('#a-view');
    if (!soft) {
        box.innerHTML = `<div class="a-loading">${t('loading')}</div>`;
        window.scrollTo(0, 0);
    }

    try {
        const r = await VIEWS[page](url.searchParams);
        if (my !== token) return;
        const v = typeof r === 'string' ? { html: r } : r;
        box.innerHTML = v.html;
        if (v.bind) v.bind();
    } catch (e) {
        if (my !== token) return;
        box.innerHTML = `<div class="a-panel"><div class="a-msg">${esc(e.message)}</div></div>`;
    }
}


/* =====================================================================
   10) الأحداث العامة (نقرات الهيدر + روابط التنقل)
===================================================================== */

document.addEventListener('click', e => {
    // تبديل اللغة
    if (e.target.closest('#a-lang')) {
        S.lang = S.lang === 'ar' ? 'en' : 'ar';
        store.set('kn_lang', S.lang);
        S.user ? (layout(), view()) : boot();
        return;
    }
    if (e.target.closest('#a-pw'))     { pwModal(); return; }
    if (e.target.closest('#a-burger')) { $('#a-sb').classList.toggle('open'); return; }

    // تسجيل الخروج
    if (e.target.closest('#a-out')) {
        api('logout', {}, {}).catch(() => {}).then(() => { S.user = null; boot(); });
        return;
    }

    // روابط الأدمن الداخلية: ننتقل بدون تحميل الصفحة
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !routeOf(url)) return;
    e.preventDefault();
    go(url);
});

// زر الرجوع/الأمام بالمتصفح
addEventListener('popstate', () => S.user && view());


/* =====================================================================
   11) التشغيل: نتأكد إنه في أدمن مسجّل دخول (أو نعرض إعداد أول أدمن)
===================================================================== */

async function boot() {
    try {
        S.user = (await api('me')).user;

        // أدمن مسجّل: نعرض اللوحة
        if (S.user && S.user.role === 'admin') { layout(); view(); return; }

        // غير مسجّل: شاشة دخول (أو إعداد أول أدمن لو ما في أدمن)
        const needsSetup = !S.user && (await api('setup-status')).needs_setup;
        gate(needsSetup);

        // مسجّل بس مش أدمن
        if (S.user) $('#a-msg').textContent = t('gNotAdmin');
    } catch (e) {
        root().innerHTML = `<div class="a-gate"><div class="a-gate-card"><h1>${t('errGen')}</h1><div class="a-msg">${esc(e.message)}</div></div></div>`;
    }
}

boot();

})();