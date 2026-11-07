

const BASE = new URL('../../', document.currentScript.src).href;   // مجلد frontend
const API = BASE + 'api.php';
const PLACEHOLDER = BASE + 'assets/images/placeholder.svg';       

// اختصارات: $ = عنصر واحد، $$ = كل العناصر
function $(selector, parent = document) {
    return parent.querySelector(selector);
}
function $$(selector, parent = document) {
    return [...parent.querySelectorAll(selector)];
}

// حفظ/قراءة اللغة من المتصفح (try/catch لأنه ممكن المتصفح يمنع localStorage)
function loadLang() {
    try { return localStorage.getItem('kn_lang'); } catch (e) { return null; }
}
function saveLang(value) {
    try { localStorage.setItem('kn_lang', value); } catch (e) { }
}

let lang = loadLang() === 'en' ? 'en' : 'ar';   // اللغة الحالية
let currentUser = null;                          // المستخدم المسجّل دخول

const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];


/* =====================================================================
   2) النصوص (عربي / إنجليزي)  —  كل نص: [عربي, English]
   هاد القسم مجرد قاموس، ما فيه منطق
===================================================================== */

const TEXT = {
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

    /* تسجيل الدخول */
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

// جلب النص حسب اللغة الحالية: t('save') => "حفظ" أو "Save"
function t(key) {
    const pair = TEXT[key];
    if (!pair) return key;
    return lang === 'ar' ? pair[0] : pair[1];
}


/* =====================================================================
   3) دوال العرض (تنسيق)
===================================================================== */

// حماية من XSS: نحوّل الرموز الخاصة قبل ما نعرض أي نص
function esc(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(text ?? '').replace(/[&<>"']/g, ch => map[ch]);
}

// المبلغ: 12.50 د.أ  أو  JOD 12.50
const numberFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function money(n) {
    const formatted = numberFormat.format(+n || 0);
    return lang === 'ar' ? formatted + ' د.أ' : 'JOD ' + formatted;
}

// التاريخ والوقت
function formatDate(s) {
    const date = new Date(String(s).replace(' ', 'T'));
    const locale = lang === 'ar' ? 'ar-JO-u-nu-latn' : 'en-GB';
    return date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}

// رابط الصورة: صور السيرفر بتمر عن طريق الأكشن img
function imgSrc(path) {
    if (!path) return PLACEHOLDER;
    if (/^(https?:|data:)/.test(path)) return path;
    return API + '?action=img&path=' + encodeURIComponent(path);
}

// وسم صورة (وإذا فشلت بنعرض الصورة البديلة)
function img(path, alt = '') {
    return `<img src="${esc(imgSrc(path))}" alt="${esc(alt)}" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER}'">`;
}

// شارة حالة الطلب
function chip(status) {
    return `<span class="a-chip st-${esc(status)}">${t('st' + status)}</span>`;
}

// جدول جاهز: headers = عناوين الأعمدة، rows = صفوف HTML جاهزة
function table(headers, rows) {
    const head = headers.map(h => `<th>${h}</th>`).join('');
    const body = rows || `<tr><td colspan="${headers.length}" class="a-empty">${t('none')}</td></tr>`;
    return `<div class="a-table"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

// صندوق بعنوان
function panel(title, body, extra = '') {
    return `<section class="a-panel"><div class="a-panel-head"><h2>${title}</h2>${extra}</div>${body}</section>`;
}


/* =====================================================================
   4) الاتصال بالسيرفر
   api('اسم_الأكشن', {بارامترات الرابط}, body)
   - بدون body = GET
   - body كائن عادي = JSON
   - body من نوع FormData = رفع ملفات
===================================================================== */

async function api(action, params = {}, body) {
    const url = new URL(API);
    url.searchParams.set('action', action);
    for (const key in params) {
        if (params[key] !== '' && params[key] != null) url.searchParams.set(key, params[key]);
    }

    const options = { credentials: 'same-origin' };
    if (body instanceof FormData) {
        options.method = 'POST';
        options.body = body;
    } else if (body) {
        options.method = 'POST';
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    let data;
    try {
        data = await response.json();
    } catch (e) {
        throw new Error(t('errSrv'));
    }

    if (!response.ok) {
        const message = (lang === 'en' && data.error_en) || data.error || t('errGen');
        throw new Error(message);
    }
    return data;
}


/* =====================================================================
   5) النوافذ: رسالة صغيرة + نافذة عامة + تأكيد الحذف
===================================================================== */

// رسالة صغيرة بتظهر تحت وبتختفي لحالها
let toastTimer;
function toast(message, isError) {
    let el = $('#a-toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'a-toast';
        document.body.appendChild(el);
    }
    el.textContent = message;
    el.className = isError ? 'show bad' : 'show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = ''; }, 2800);
}

// نافذة منبثقة عامة (تفاصيل طلب، صور مستخدم، تغيير كلمة المرور)
function modal(html) {
    const box = document.createElement('div');
    box.className = 'a-modal';
    box.innerHTML = `<div class="a-modal-box" role="dialog" aria-modal="true">
        <button class="a-x" type="button" aria-label="${t('close')}">×</button>${html}</div>`;

    function close() {
        box.remove();
        document.removeEventListener('keydown', onKey);
    }
    function onKey(e) {
        if (e.key === 'Escape') close();
    }

    // الإغلاق: بالضغط على X أو برا النافذة أو زر Esc
    box.addEventListener('click', e => {
        if (e.target === box || e.target.closest('.a-x')) close();
    });
    document.addEventListener('keydown', onKey);

    document.body.appendChild(box);
    box.close = close;
    return box;
}

// نافذة تأكيد الحذف: لو ضغط "حذف" بننفذ onYes
function confirmBox(name, onYes) {
    const overlay = document.createElement('div');
    overlay.className = 'a-confirm-overlay';
    overlay.innerHTML = `
        <div class="a-confirm-box" role="alertdialog" aria-modal="true">
            <div class="a-confirm-icon">🗑</div>
            <h3>${t('delTitle')}</h3>
            <p>${t('sure')}${name ? `<br><b>${esc(name)}</b>` : ''}</p>
            <div class="a-confirm-actions">
                <button class="a-confirm-cancel" type="button">${t('cancel')}</button>
                <button class="a-confirm-delete" type="button">${t('del')}</button>
            </div>
        </div>`;

    function close() {
        overlay.remove();
        document.removeEventListener('keydown', onKey);
    }
    function onKey(e) {
        if (e.key === 'Escape') close();
    }

    overlay.addEventListener('click', e => {
        if (e.target === overlay || e.target.closest('.a-confirm-cancel')) {
            close();
        } else if (e.target.closest('.a-confirm-delete')) {
            close();
            onYes();
        }
    });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    $('.a-confirm-cancel', overlay).focus();   // الفوكس على "إلغاء" عشان ما يتحذف بالغلط
}

// حذف عنصر بعد التأكيد: منتج / تصنيف / مستخدم
function askDelete(action, id, name) {
    confirmBox(name, async () => {
        try {
            await api(action, {}, { id: id });
            toast(t('deleted'));
            showPage();   // نعيد رسم الصفحة
        } catch (e) {
            toast(e.message, true);
        }
    });
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
        } catch (err) {
            $('#pw-msg', m).textContent = err.message;
        }
    };
}


/* =====================================================================
   6) الصفحات والقائمة الجانبية
===================================================================== */

// اسم ملف الصفحة => اسم الشاشة
const PAGES = {
    'dashboard.html': 'dashboard', 'products.html': 'products', 'add-product.html': 'add',
    'edit-product.html': 'edit', 'categories.html': 'categories', 'orders.html': 'orders',
    'users.html': 'users', 'artisans.html': 'artisans', 'product-images.html': 'images',
    'activity-logs.html': 'logs'
};

// عنوان كل شاشة
const TITLES = {
    dashboard: 't_dashboard', products: 't_products', add: 't_add', edit: 't_edit', categories: 't_categories',
    orders: 't_orders', users: 't_users', artisans: 't_artisans', images: 't_images', logs: 't_logs'
};

// عناصر القائمة: [مفتاح، ملف، نص، أيقونة] — اللي بدون ملف هو عنوان قسم
const NAV = [
    ['main', null],
    ['dashboard', 'dashboard.html', 'nDash', '▦'],
    ['products', 'products.html', 'nProducts', '◇'],
    ['categories', 'categories.html', 'nCats', '▤'],
    ['orders', 'orders.html', 'nOrders', '▣'],
    ['users', 'users.html', 'nUsers', '♙'],
    ['content', null],
    ['artisans', 'artisans.html', 'nArtisans', '✿'],
    ['images', 'product-images.html', 'nImages', '▧'],
    ['logs', 'activity-logs.html', 'nLogs', '◷']
];

// رابط صفحة أدمن
function adminLink(file) {
    return BASE + 'admin/' + file;
}

// أنهي صفحة مفتوحة الآن؟ (من اسم الملف بالرابط)
function currentPage() {
    const fileName = location.pathname.split('/').pop().toLowerCase();
    return PAGES[fileName] || 'dashboard';
}

// الهيكل العام: قائمة جانبية + هيدر + مكان المحتوى
function layout() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    const mark = lang === 'ar' ? 'ك' : 'K';
    const page = currentPage();
    // إضافة/تعديل منتج = نفس خانة "المنتجات" بالقائمة
    const activeKey = (page === 'add' || page === 'edit') ? 'products' : page;

    let links = '';
    for (const item of NAV) {
        if (item[1]) {
            const active = item[0] === activeKey ? 'active' : '';
            links += `<a class="side-link ${active}" href="${adminLink(item[1])}"><span class="si">${item[3]}</span>${t(item[2])}</a>`;
        } else {
            links += `<span class="side-label">${t(item[0] === 'main' ? 'mMain' : 'mContent')}</span>`;
        }
    }

    $('#admin-root').innerHTML = `
    <div class="admin-shell">
        <aside class="admin-sidebar" id="a-sb">
            <a class="brand" href="${adminLink('dashboard.html')}"><span class="brand-mark">${mark}</span><span><b>KANAAN</b><small>${t('brandSub')}</small></span></a>
            <div class="admin-profile">
                <div class="avatar">${esc(String(currentUser.name).slice(0, 1).toUpperCase())}</div>
                <div><b>${esc(currentUser.name)}</b><small>${t('roleAdmin')}</small></div>
            </div>
            ${links}
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

    // ربط أزرار الهيدر
    $('#a-lang').onclick = toggleLang;
    $('#a-pw').onclick = pwModal;
    $('#a-burger').onclick = () => $('#a-sb').classList.toggle('open');
    $('#a-out').onclick = async () => {
        try { await api('logout', {}, {}); } catch (e) { }
        location.reload();
    };
}

// تبديل اللغة: نحفظها ونعيد تحميل الصفحة
function toggleLang() {
    lang = lang === 'ar' ? 'en' : 'ar';
    saveLang(lang);
    location.reload();
}

// شاشة الدخول (أو إعداد أول أدمن لو setup = true)
function gate(setup) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    const mark = lang === 'ar' ? 'ك' : 'K';
    const nameField = setup
        ? `<label class="a-f"><span>${t('gName')}</span><input name="name" required minlength="3"></label>`
        : '';

    $('#admin-root').innerHTML = `
    <div class="a-gate"><form class="a-gate-card" id="a-gate">
        <button class="a-btn a-btn-light a-gate-lang" id="a-lang" type="button">${t('langTo')}</button>
        <a class="brand" href="${BASE}index.html"><span class="brand-mark">${mark}</span><span><b>KANAAN</b><small>${t('brandSub')}</small></span></a>
        <h1>${setup ? t('gSetup') : t('gLogin')}</h1>
        <p>${setup ? t('gSetupP') : t('gLoginP')}</p>
        ${nameField}
        <label class="a-f"><span>${t('gEmail')}</span><input name="email" type="email" required autocomplete="email"></label>
        <label class="a-f"><span>${t('gPass')}</span><input name="password" type="password" required minlength="${setup ? 8 : 1}" autocomplete="${setup ? 'new-password' : 'current-password'}"></label>
        <div class="a-msg" id="a-msg" role="alert"></div>
        <button class="a-btn a-btn-primary a-block" type="submit">${setup ? t('gCreate') : t('gGo')}</button>
    </form></div>`;

    $('#a-lang').onclick = toggleLang;

    $('#a-gate').onsubmit = async e => {
        e.preventDefault();
        try {
            const action = setup ? 'setup-admin' : 'login';
            await api(action, {}, Object.fromEntries(new FormData(e.target)));
            await boot();
        } catch (err) {
            $('#a-msg').textContent = err.message;
        }
    };
}


/* =====================================================================
   7) الشاشات
   كل شاشة: بتجيب البيانات من السيرفر، بتبني HTML، بتحطه بالصفحة، وبتربط الأزرار
===================================================================== */

// بنحط HTML داخل مكان المحتوى
function render(html) {
    $('#a-view').innerHTML = html;
}

/* ---------- لوحة التحكم ---------- */
async function vDashboard() {
    const g = await api('admin-stats');

    // بطاقات الأرقام: [نص، قيمة، صفحة]
    const stats = [
        ['sProducts', g.products, 'products.html'],
        ['sCats', g.categories, 'categories.html'],
        ['sOrders', g.orders, 'orders.html'],
        ['sUsers', g.users, 'users.html'],
        ['sPending', g.pending, 'orders.html?status=Pending'],
        ['sRevenue', money(g.revenue), 'orders.html']
    ];
    const statsHtml = stats.map(s =>
        `<a class="a-stat" href="${adminLink(s[2])}"><small>${t(s[0])}</small><strong>${s[1]}</strong></a>`
    ).join('');

    // الرسم البياني: ارتفاع كل عمود نسبة لأعلى شهر
    const monthly = g.monthly || [];
    let max = 1;
    for (const m of monthly) {
        if (+m.revenue > max) max = +m.revenue;
    }
    const barsHtml = monthly.map(m => {
        const height = Math.max(4, (+m.revenue / max) * 100);
        return `<div class="a-bar-col">
            <div class="a-bar-value">${money(m.revenue)}</div>
            <div class="a-bar-track"><i style="height:${height}%"></i></div>
            <small>${esc(m.month)}</small>
        </div>`;
    }).join('');

    // أحدث الطلبات
    const recentRows = g.recent.map(o =>
        `<tr><td>#${o.id}</td><td>${esc(o.full_name)}</td><td>${money(o.total)}</td><td>${chip(o.status)}</td><td>${formatDate(o.created_at)}</td></tr>`
    ).join('');

    // المخزون المنخفض
    let lowHtml;
    if (g.low_stock.length) {
        const items = g.low_stock.map(p =>
            `<li><a href="${adminLink('edit-product.html?id=' + p.id)}">${esc(p.name)}</a><b class="${p.stock < 1 ? 'bad' : ''}">${p.stock} ${t('pcs')}</b></li>`
        ).join('');
        lowHtml = `<ul class="a-list">${items}</ul>`;
    } else {
        lowHtml = `<p class="a-empty">${t('dAllOk')}</p>`;
    }

    const recentHead = [t('oNo'), t('oCust'), t('oTotal'), t('oStatus'), t('oDate')];
    const ordersLink = `<a class="a-link" href="${adminLink('orders.html')}">${t('nOrders')} →</a>`;

    render(`
        <div class="a-stats">${statsHtml}</div>
        <div class="a-chart-panel">
            <div class="a-chart-head"><h3>${t('dChart')}</h3><span>${t('dChartNote')}</span></div>
            <div class="a-bars">${barsHtml || `<p class="a-empty">${t('none')}</p>`}</div>
        </div>
        <div class="a-cols">
            ${panel(t('dRecent'), table(recentHead, recentRows), ordersLink)}
            ${panel(t('dLow'), lowHtml)}
        </div>`);
}

/* ---------- الطلبات ---------- */
async function vOrders() {
    const status = new URLSearchParams(location.search).get('status') || '';
    const rows = (await api('admin-orders', { status: status })).items;

    // أزرار فلترة الحالة
    function pill(key) {
        const active = status === key ? 'active' : '';
        const href = adminLink('orders.html' + (key ? '?status=' + key : ''));
        const label = key ? t('st' + key) : t('all');
        return `<a class="a-pill ${active}" href="${href}">${label}</a>`;
    }
    const pills = pill('') + STATUSES.map(pill).join('');

    const head = [t('oNo'), t('oCust'), t('oPhone'), t('oCity'), t('oItems'), t('oTotal'), t('oStatus'), t('oPay'), t('oDate'), ''];
    const body = rows.map(o => `
        <tr><td>#${o.id}</td><td>${esc(o.full_name)}</td><td dir="ltr">${esc(o.phone)}</td><td>${esc(o.city)}</td><td>${o.items_count}</td>
            <td>${money(o.total)}</td><td>${chip(o.status)}</td><td>${t('pay' + o.payment_status)}</td><td>${formatDate(o.created_at)}</td>
            <td><button class="a-btn a-btn-sm" data-order="${o.id}" type="button">${t('view')}</button></td></tr>`
    ).join('');

    render(`<div class="a-pills">${pills}</div>${panel(t('nOrders') + ` (${rows.length})`, table(head, body))}`);

    // زر "عرض" يفتح تفاصيل الطلب
    $$('[data-order]').forEach(btn => {
        btn.onclick = () => orderModal(+btn.dataset.order);
    });
}

// نافذة تفاصيل الطلب + تغيير الحالة والدفع
async function orderModal(id) {
    let o;
    try {
        o = (await api('admin-order', { id: id })).order;
    } catch (e) {
        toast(e.message, true);
        return;
    }

    const closed = o.status === 'Cancelled';   // الطلب الملغي ما بنغيّر حالته

    // قائمة منسدلة: name = status أو payment_status
    function select(name, options, current, locked) {
        const prefix = name === 'status' ? 'st' : 'pay';
        const opts = options.map(v =>
            `<option value="${v}" ${v === current ? 'selected' : ''}>${t(prefix + v)}</option>`
        ).join('');
        return `<select name="${name}" ${locked ? 'disabled' : ''}>${opts}</select>`;
    }

    const lines = o.items.map(i =>
        `<tr><td>${esc(i.product_name)}</td><td>${money(i.unit_price)}</td><td>${i.quantity}</td><td>${money(i.unit_price * i.quantity)}</td></tr>`
    ).join('');

    const m = modal(`
        <h2>${t('oDetail')} #${o.id}</h2>
        <dl class="a-dl">
            <div><dt>${t('oCust')}</dt><dd>${esc(o.full_name)}</dd></div>
            <div><dt>${t('oPhone')}</dt><dd dir="ltr">${esc(o.phone)}</dd></div>
            <div><dt>${t('oEmail')}</dt><dd>${esc(o.email || '—')}</dd></div>
            <div><dt>${t('oDate')}</dt><dd>${formatDate(o.created_at)}</dd></div>
            <div class="wide"><dt>${t('oAddr')}</dt><dd>${esc(o.city)}, ${esc(o.address)}</dd></div>
            ${o.notes ? `<div class="wide"><dt>${t('oNotes')}</dt><dd>${esc(o.notes)}</dd></div>` : ''}
        </dl>
        ${table([t('oLines'), t('pPrice'), t('oQty'), t('oTotal')], lines)}
        <div class="a-sum"><span>${t('oTotal')}</span><b>${money(o.total)}</b></div>
        <form id="o-form" class="a-row">
            <label class="a-f"><span>${t('oStatus')}</span>${select('status', STATUSES, o.status, closed)}</label>
            <label class="a-f"><span>${t('oPay')}</span>${select('payment_status', ['Unpaid', 'Paid'], o.payment_status, false)}</label>
            <button class="a-btn a-btn-primary" type="submit">${t('save')}</button>
        </form>
        <p class="a-hint">${t('oCancelWarn')}</p>`);

    $('#o-form', m).onsubmit = async e => {
        e.preventDefault();
        const values = Object.fromEntries(new FormData(e.target));
        if (closed) values.status = 'Cancelled';   // الحقل المعطّل ما بينبعت، فنرجّعه يدوياً
        try {
            await api('admin-order-update', {}, { id: id, ...values });
            toast(t('saved'));
            m.close();
            showPage();
        } catch (err) {
            toast(err.message, true);
        }
    };
}

/* ---------- المنتجات (جدول + بحث + حذف) ---------- */
async function vProducts() {
    const items = (await api('products')).items;
    const head = ['', t('pName'), t('pCat'), t('pPrice'), t('pStock'), ''];

    // بنية صفوف الجدول من قائمة منتجات
    function buildRows(list) {
        return list.map(p => `
            <tr><td class="a-thumb">${img(p.image, p.name)}</td><td><b>${esc(p.name)}</b></td><td>${esc(p.category_name || '—')}</td>
                <td>${money(p.price)}</td><td class="${p.stock < 1 ? 'bad' : ''}">${p.stock}</td>
                <td class="a-acts">
                    <a class="a-btn a-btn-sm" href="${adminLink('edit-product.html?id=' + p.id)}">${t('edit')}</a>
                    <button class="a-btn a-btn-sm a-btn-del" data-del="${p.id}" type="button">${t('del')}</button>
                </td></tr>`).join('');
    }

    // نرسم الجدول ونربط أزرار الحذف (بنعيدها كل ما تغيّر البحث)
    function drawTable(list) {
        $('#p-tbl').innerHTML = table(head, buildRows(list));
        $$('[data-del]', $('#p-tbl')).forEach(btn => {
            btn.onclick = () => {
                const product = items.find(x => x.id == btn.dataset.del);
                askDelete('admin-product-delete', +btn.dataset.del, product && product.name);
            };
        });
    }

    const addBtn = `<a class="a-btn a-btn-primary" href="${adminLink('add-product.html')}">${t('pAdd')}</a>`;
    render(panel(t('nProducts') + ` (${items.length})`,
        `<input class="a-search" id="p-q" type="search" placeholder="${t('pSearch')}"><div id="p-tbl"></div>`,
        addBtn));
    drawTable(items);

    // البحث بالاسم أو بالتصنيف
    $('#p-q').oninput = () => {
        const q = $('#p-q').value.trim().toLowerCase();
        const filtered = items.filter(p =>
            !q || p.name.toLowerCase().includes(q) || (p.category_name || '').toLowerCase().includes(q)
        );
        drawTable(filtered);
    };
}

/* ---------- إضافة / تعديل منتج ---------- */
async function vProductForm(edit) {
    const cats = (await api('categories')).items;
    const id = new URLSearchParams(location.search).get('id');
    const p = edit ? (await api('product', { id: id })).item : {};

    // حقل إدخال عادي
    function field(name, label, attrs = '', type = 'text') {
        return `<label class="a-f"><span>${label}</span><input name="${name}" type="${type}" value="${esc(p[name] ?? '')}" ${attrs}></label>`;
    }

    const catOptions = cats.map(c => {
        const selected = String(p.category_id) === String(c.id) ? 'selected' : '';
        return `<option value="${c.id}" ${selected}>${esc(c.name)}</option>`;
    }).join('');

    render(panel(edit ? t('t_edit') : t('t_add'), `
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
                <a class="a-btn a-btn-light" href="${adminLink('products.html')}">${t('cancel')}</a>
            </div>
        </form>`));

    // معاينة الصورة قبل الرفع
    $('#p-img').onchange = e => {
        const file = e.target.files[0];
        if (file) $('#pv').innerHTML = `<img src="${URL.createObjectURL(file)}" alt="">`;
    };

    // حفظ المنتج
    $('#p-form').onsubmit = async e => {
        e.preventDefault();
        try {
            await api('admin-product-save', {}, formData(e.target, edit && p.id));
            toast(t('saved'));
            location.href = adminLink('products.html');
        } catch (err) {
            $('#p-msg').textContent = err.message;
        }
    };
}

/* ---------- التصنيفات (فورم + جدول + حذف) ---------- */
async function vCategories() {
    const cats = (await api('categories')).items;
    const prods = (await api('products')).items;
    const editId = new URLSearchParams(location.search).get('id');
    const cur = cats.find(c => c.id == editId) || {};   // لو في id بالرابط = تعديل

    // كم منتج بكل تصنيف
    function countProducts(catId) {
        return prods.filter(p => p.category_id == catId).length;
    }

    const rows = cats.map(c => `
        <tr><td class="a-thumb">${img(c.image, c.name)}</td><td><b>${esc(c.name)}</b></td><td>${esc(c.description || '—')}</td><td>${countProducts(c.id)}</td>
            <td class="a-acts">
                <a class="a-btn a-btn-sm" href="${adminLink('categories.html?id=' + c.id)}">${t('edit')}</a>
                <button class="a-btn a-btn-sm a-btn-del" data-del="${c.id}" type="button">${t('del')}</button>
            </td></tr>`).join('');

    const cancelBtn = cur.id ? `<a class="a-btn a-btn-light" href="${adminLink('categories.html')}">${t('cancel')}</a>` : '';

    const formPanel = panel(cur.id ? t('cEdit') : t('cNew'), `
        <form id="c-form" class="a-form">
            <label class="a-f"><span>${t('cName')}</span><input name="name" required minlength="2" value="${esc(cur.name || '')}"></label>
            <label class="a-f"><span>${t('cDesc')}</span><input name="description" value="${esc(cur.description || '')}"></label>
            <div class="a-f wide"><span>${t('pImage')}</span>
                <div class="a-upload"><div class="a-preview sm">${img(cur.image)}</div><input name="image" type="file" accept="image/jpeg,image/png,image/webp"></div>
            </div>
            <div class="a-msg wide" id="c-msg" role="alert"></div>
            <div class="a-actions wide">
                <button class="a-btn a-btn-primary" type="submit">${cur.id ? t('save') : t('add')}</button>
                ${cancelBtn}
            </div>
        </form>`);

    const listPanel = panel(t('nCats') + ` (${cats.length})`, table(['', t('cName'), t('cDesc'), t('cProducts'), ''], rows));

    render(formPanel + listPanel);

    // حفظ التصنيف
    $('#c-form').onsubmit = async e => {
        e.preventDefault();
        try {
            await api('admin-category-save', {}, formData(e.target, cur.id));
            toast(t('saved'));
            location.href = adminLink('categories.html');
        } catch (err) {
            $('#c-msg').textContent = err.message;
        }
    };

    // حذف تصنيف
    $$('[data-del]').forEach(btn => {
        btn.onclick = () => {
            const c = cats.find(x => x.id == btn.dataset.del);
            askDelete('admin-category-delete', +btn.dataset.del, c && c.name);
        };
    });
}

/* ---------- المستخدمين ---------- */
async function vUsers() {
    const rows = (await api('admin-users')).items;
    const head = [t('uName'), t('uEmail'), t('uRole'), t('uOrders'), t('uPhotos'), t('uJoined'), ''];

    const body = rows.map(u => {
        const isMe = u.id == currentUser.id;   // الأدمن ما بيعدّل دوره ولا بيحذف نفسه
        const avatar = u.profile_image
            ? img(u.profile_image, u.name)
            : `<span class="a-user-avatar">${esc((u.name || 'K').slice(0, 1))}</span>`;
        const deleteBtn = isMe ? '' : `<button class="a-btn a-btn-sm a-btn-del" data-del="${u.id}" type="button">${t('del')}</button>`;

        return `
        <tr><td><div class="a-user-cell">${avatar}<b>${esc(u.name)}</b></div></td><td dir="ltr">${esc(u.email)}</td>
            <td><select data-role="${u.id}" ${isMe ? 'disabled' : ''}>
                <option value="customer" ${u.role === 'customer' ? 'selected' : ''}>${t('roleCustomer')}</option>
                <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>${t('roleAdmin')}</option>
            </select></td>
            <td>${u.orders_count}</td>
            <td><button class="a-btn a-btn-sm" data-user-images="${u.id}" type="button">${t('view')} (${u.images_count || 0})</button></td>
            <td>${formatDate(u.created_at)}</td>
            <td class="a-acts">${deleteBtn}</td></tr>`;
    }).join('');

    render(panel(t('nUsers') + ` (${rows.length})`, table(head, body)));

    // تغيير دور المستخدم
    $$('[data-role]').forEach(select => {
        select.onchange = async () => {
            try {
                await api('admin-user-update', {}, { id: +select.dataset.role, role: select.value });
                toast(t('saved'));
            } catch (err) {
                toast(err.message, true);
                showPage();
            }
        };
    });

    // عرض صور حساب المستخدم
    $$('[data-user-images]').forEach(btn => {
        btn.onclick = async () => {
            try {
                const items = (await api('admin-user-images', { user_id: btn.dataset.userImages })).items;
                let html;
                if (items.length) {
                    const figures = items.map(ph =>
                        `<figure>${img(ph.image_path, ph.name)}<figcaption>${formatDate(ph.created_at)}</figcaption></figure>`
                    ).join('');
                    html = `<div class="a-user-gallery">${figures}</div>`;
                } else {
                    html = `<p class="a-empty">${t('uNoPhotos')}</p>`;
                }
                modal(`<h2>${t('uPhotosTitle')}</h2>${html}`);
            } catch (err) {
                toast(err.message, true);
            }
        };
    });

    // حذف مستخدم
    $$('[data-del]').forEach(btn => {
        btn.onclick = () => {
            const u = rows.find(x => x.id == btn.dataset.del);
            askDelete('admin-user-delete', +btn.dataset.del, u && u.name);
        };
    });
}

/* ---------- الحرفيين ---------- */
async function vArtisans() {
    const rows = (await api('admin-artisans')).items;

    let cards;
    if (rows.length) {
        const list = rows.map(r =>
            `<article class="a-card"><h3>${esc(r.artisan_name)}</h3><p>${esc(r.artisan_story || '')}</p><small>${r.products_count} ${t('aProductsN')}</small></article>`
        ).join('');
        cards = `<div class="a-cards">${list}</div>`;
    } else {
        cards = `<p class="a-empty">${t('none')}</p>`;
    }

    render(panel(t('nArtisans') + ` (${rows.length})`, cards) + `<p class="a-hint">${t('aHint')}</p>`);
}

/* ---------- صور المنتجات (تغيير صورة منتج بسرعة) ---------- */
async function vImages() {
    const items = (await api('products')).items;

    const cards = items.map(p => `
        <article class="a-img">
            <div class="a-img-box">${img(p.image, p.name)}</div><b>${esc(p.name)}</b>
            <label class="a-btn a-btn-sm a-btn-light">${t('iUpload')}<input type="file" hidden data-up="${p.id}" accept="image/jpeg,image/png,image/webp"></label>
        </article>`).join('');

    render(panel(t('nImages'), `<div class="a-imgs">${cards || `<p class="a-empty">${t('none')}</p>`}</div><p class="a-hint">${t('pHint')}</p>`));

    // رفع صورة جديدة لمنتج
    $$('[data-up]').forEach(input => {
        input.onchange = async () => {
            if (!input.files[0]) return;
            const fd = new FormData();
            fd.append('id', input.dataset.up);
            fd.append('image', input.files[0]);
            try {
                await api('admin-product-image', {}, fd);
                toast(t('iDone'));
                showPage();
            } catch (err) {
                toast(err.message, true);
            }
        };
    });
}

/* ---------- سجل النشاطات ---------- */
async function vLogs() {
    const rows = (await api('admin-logs')).items;

    const body = rows.map(r => {
        // اسم العملية: لو عنا ترجمة بنستخدمها، وإلا بنعرض الاسم زي ما هو
        const actionName = TEXT['a_' + r.action] ? t('a_' + r.action) : r.action;
        return `<tr><td>${formatDate(r.created_at)}</td><td>${esc(r.user_name || '—')}</td><td>${esc(actionName)}</td><td>${esc(r.details || '')}</td></tr>`;
    }).join('');

    render(panel(t('nLogs'), table([t('lWhen'), t('lUser'), t('lAction'), t('lDetails')], body)));
}


/* =====================================================================
   8) عرض الصفحة الحالية
===================================================================== */

async function showPage() {
    const page = currentPage();

    $('#a-title').textContent = t(TITLES[page]);
    document.title = 'KANAAN Admin | ' + t(TITLES[page]);

    try {
        if (page === 'dashboard') await vDashboard();
        else if (page === 'orders') await vOrders();
        else if (page === 'products') await vProducts();
        else if (page === 'add') await vProductForm(false);
        else if (page === 'edit') await vProductForm(true);
        else if (page === 'categories') await vCategories();
        else if (page === 'users') await vUsers();
        else if (page === 'artisans') await vArtisans();
        else if (page === 'images') await vImages();
        else if (page === 'logs') await vLogs();
    } catch (e) {
        render(`<div class="a-panel"><div class="a-msg">${esc(e.message)}</div></div>`);
    }
}


/* =====================================================================
   9) التشغيل: نتأكد إنه في أدمن مسجّل دخول (أو نعرض إعداد أول أدمن)
===================================================================== */

async function boot() {
    try {
        currentUser = (await api('me')).user;

        // أدمن مسجّل: نعرض اللوحة
        if (currentUser && currentUser.role === 'admin') {
            layout();
            showPage();
            return;
        }

        // غير مسجّل: شاشة دخول (أو إعداد أول أدمن لو ما في أدمن)
        const needsSetup = !currentUser && (await api('setup-status')).needs_setup;
        gate(needsSetup);

        // مسجّل بس مش أدمن
        if (currentUser) $('#a-msg').textContent = t('gNotAdmin');
    } catch (e) {
        $('#admin-root').innerHTML = `<div class="a-gate"><div class="a-gate-card"><h1>${t('errGen')}</h1><div class="a-msg">${esc(e.message)}</div></div></div>`;
    }
}

boot();