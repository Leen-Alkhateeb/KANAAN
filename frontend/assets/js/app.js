(function () {
'use strict';

/* =====================================================================
   KANAAN storefront — نسخة مبسّطة وبدون تكرار
   الأقسام:
     1) الإعدادات والحالة      5) الهيدر والفوتر
     2) النصوص (عربي/English)  6) مكونات صغيرة (مشتركة)
     3) دوال مساعدة            7) الصفحات
     4) الاتصال بالسيرفر       8) الراوتر والأحداث والتشغيل
===================================================================== */


/* =====================================================================
   1) الإعدادات والحالة
===================================================================== */

const BASE = new URL('../../', document.currentScript.src).href;   // مجلد frontend
const API = BASE + 'api.php';
const VIDEO = BASE + 'assets/videos/15898195_3840_2160_30fps.mp4';
const PLACEHOLDER = BASE + 'assets/images/placeholder.svg';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_UPLOAD = 2 * 1024 * 1024;   // 2MB

// اختصارات: $ = عنصر واحد، $$ = كل العناصر
function $(selector, parent = document) {
    return parent.querySelector(selector);
}
function $$(selector, parent = document) {
    return [...parent.querySelectorAll(selector)];
}

// قراءة/حفظ بالمتصفح (try/catch لأنه ممكن localStorage يكون ممنوع)
function storeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
}
function storeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { }
}

// الحالة العامة
let lang = storeGet('kn_lang') === 'en' ? 'en' : 'ar';   // اللغة الحالية
let currentUser = null;                                  // المستخدم المسجّل
let cartCount = 0;                                       // عدد القطع بالسلة
let categories = [];                                     // التصنيفات

function isArabic() {
    return lang === 'ar';
}

function isAdmin() {
    return !!currentUser && currentUser.role === 'admin';
}


/* =====================================================================
   2) النصوص — كل نص: [عربي, English]  (قاموس بس، ما فيه منطق)
===================================================================== */

const TEXT = {
    /* chrome */
    top1: ['صناعة يدوية تحمل حكاية أرض', 'Handmade with a story from our land'],
    top2: ['كل قطعة تحكي حكاية من فلسطين', 'Every piece tells a story of Palestine'],
    mark: ['ك', 'K'],
    tagline: ['حكاية من أرضنا', 'A Story from Our Land'],
    menu: ['القائمة', 'Menu'],
    nHome: ['الرئيسية', 'Home'], nShop: ['تسوق الحرف', 'Shop Crafts'], nEmb: ['التطريز', 'Embroidery'],
    nPot: ['الفخار', 'Pottery'], nStory: ['حكايتنا', 'Our Story'],
    signIn: ['تسجيل الدخول', 'Sign In'], myAcc: ['حسابي', 'My Account'], cartL: ['السلة', 'Cart'],
    langTo: ['EN', 'عربي'], langAria: ['Switch to English', 'التبديل إلى العربية'],
    fAbout: ['نحتفي بالحرف الفلسطينية ونمنح كل قطعة مساحة لتحكي قصة صانعها وأرضها.', 'We celebrate Palestinian craftsmanship and give every handmade piece room to tell the story of its maker and homeland.'],
    fDisc: ['اكتشف كنعان', 'Discover KANAAN'], fAll: ['كل المنتجات', 'All Products'], fOrders: ['طلباتي', 'My Orders'], fProfile: ['الملف الشخصي', 'My profile'],
    fServ: ['خدمة العملاء', 'Customer Service'], fCart: ['سلة المشتريات', 'Shopping Cart'], fReg: ['إنشاء حساب', 'Create Account'],
    fTouch: ['ابقَ على تواصل', 'Stay Connected'],
    fTouchP: ['منتجات أصيلة، صُنعت بحب، وتحمل أثر المكان.', 'Authentic products, made with love, carrying the spirit of the land.'],
    madeIn: ['صنع في فلسطين ♡', 'Made in Palestine ♡'],
    rights: ['© 2026 KANAAN — جميع الحقوق محفوظة', '© 2026 KANAAN — All Rights Reserved'],

    /* common */
    loading: ['جاري التحميل...', 'Loading...'],
    errT: ['تعذّر تحميل البيانات', 'Unable to load data'],
    errP: ['تأكد من تشغيل XAMPP واستيراد قاعدة البيانات وصحة مسار المشروع.', 'Make sure XAMPP is running, the database is imported and the project path is correct.'],
    errSrv: ['تعذّر قراءة رد الخادم. تأكد من تشغيل Apache و PHP.', 'Unable to read the server response. Make sure Apache and PHP are running.'],
    errGen: ['تعذّر إتمام الطلب.', 'Unable to complete the request.'],
    toHome: ['العودة للرئيسية', 'Back to Home'],
    add: ['أضف إلى السلة', 'Add to cart'], added: ['تمت إضافة المنتج إلى السلة', 'Added to your cart'],
    sold: ['نفدت الكمية', 'Sold out'], viewAll: ['عرض الكل', 'View all'], explore: ['استكشف', 'Explore'],
    total: ['الإجمالي', 'Total'], notes: ['ملاحظات', 'Notes'], qty: ['الكمية', 'Quantity'],
    remove: ['حذف', 'Remove'], continueShop: ['متابعة التسوق', 'Continue shopping'],

    /* page titles */
    ttl_home: ['الرئيسية', 'Home'], ttl_catalog: ['تسوق الحرف', 'Shop'], ttl_product: ['المنتج', 'Product'],
    ttl_cart: ['السلة', 'Cart'], ttl_checkout: ['إتمام الطلب', 'Checkout'], ttl_login: ['تسجيل الدخول', 'Sign In'],
    ttl_register: ['إنشاء حساب', 'Create Account'], ttl_profile: ['حسابي', 'My Profile'], ttl_myorders: ['طلباتي', 'My Orders'],
    ttl_receipt: ['ملخص الطلب', 'Order Summary'], ttl_story: ['حكايتنا', 'Our Story'],
    ttl_embroidery: ['التطريز', 'Embroidery'], ttl_pottery: ['الفخار', 'Pottery'],

    /* home */
    hEye: ['من قلب فلسطين', 'Crafted from the heart of Palestine'],
    hH1: ['إرثٌ يعيش', 'A heritage'], hH2: ['في كل قطعة', 'in every piece'],
    hP: ['من أيدي حرفيينا إلى بيتك. قطع يدوية تحمل روح الأرض ودفء الحكايات.', 'From our artisans’ hands to your home. Handmade pieces carrying the spirit of our land and the warmth of its stories.'],
    hCta: ['استكشف المجموعة', 'Explore the collection'], hStory: ['اعرف حكايتنا', 'Our story'], hStamp: ['صنع في فلسطين', 'Made in Palestine'],
    hS1: ['صناعة يدوية', 'Handmade'], hS2: ['تصاميم أصيلة', 'Authentic designs'], hS3: ['قطعة فريدة لكل بيت', 'One of a kind'],
    hColEye: ['اكتشف الحكايات', 'Explore the stories'], hCol: ['مجموعاتنا', 'Our collections'],
    hPickEye: ['مختارة بعناية', 'Carefully selected'], hPick: ['قطع لها حكاية', 'Pieces with a story'],
    hNone: ['لا توجد منتجات حالياً.', 'No products are available right now.'],
    hStEye: ['حكايتنا · متجذّرة في الأرض', 'Our story · Rooted in the land'],
    hStH: ['أكثر من قطعة.', 'More than a piece.'], hStH2: ['إنها ذاكرة.', 'It is a memory.'],
    hStP: ['كنعان يحتفي بالحرف الفلسطينية وبالأيدي التي تحفظ تقاليدها جيلاً بعد جيل. نصل الحرفيين الموهوبين بمن يقدّر الصناعة اليدوية الأصيلة.', 'KANAAN celebrates Palestinian craftsmanship and the hands that keep its traditions alive from one generation to the next. We connect talented artisans with people who value authentic handmade work.'],
    hStSign: ['من أرضنا، بكل فخر.', 'From our land, with pride.'],
    hQuote: ['حين تختار شيئاً صُنع يدوياً، فأنت تحمل حكاية إنسان ومكان.', 'When you choose something handmade, you carry the story of a person and a place.'],

    /* catalog */
    cEye: ['مجموعة كنعان', 'The KANAAN collection'], cH: ['تسوّق الحرف الفلسطينية', 'Shop Palestinian crafts'],
    cSearch: ['ابحث عن منتج أو حرفة...', 'Search for a product or craft...'], cGo: ['بحث', 'Search'],
    cAll: ['الكل', 'All'], cCount: ['منتج', 'products'], cNone: ['لا توجد منتجات مطابقة. جرّب بحثاً آخر.', 'No matching products. Try another search.'],
    sNew: ['الأحدث', 'Newest'], sLow: ['السعر: الأقل أولاً', 'Price: low to high'], sHigh: ['السعر: الأعلى أولاً', 'Price: high to low'],

    /* product */
    pShop: ['المتجر', 'Shop'],
    pDescDef: ['قطعة صُنعت يدوياً بعناية على أيدي حرفيين فلسطينيين، تجمع الأصالة والجمال.', 'A carefully handcrafted piece made by Palestinian artisans, combining authenticity and beauty.'],
    pBuy: ['اشترِ الآن', 'Buy now'], pStock: ['المتوفر', 'In stock'], pArt: ['عن الحرفي', 'Meet the maker'],
    pF1: ['صناعة يدوية', 'Handmade'], pF2: ['تصميم أصيل', 'Authentic design'], pF3: ['قطعة فريدة', 'Unique piece'],
    pRel: ['قد يعجبك أيضاً', 'You may also like'],

    /* cart */
    kEye: ['اختياراتك', 'Your selection'], kH: ['سلة المشتريات', 'Shopping cart'],
    kEmptyH: ['سلتك بانتظار حكاية جديدة', 'Your cart is waiting for a new story'],
    kEmptyP: ['لم تضف أي منتج بعد.', 'You have not added anything yet.'],
    kItems: ['عدد القطع', 'Items'], kShip: ['الشحن', 'Shipping'], kShipV: ['يُحدد عند إتمام الطلب', 'Set at checkout'],
    kGo: ['إتمام الطلب', 'Proceed to checkout'], kMore: ['أي رسوم إضافية تُؤكد عند إتمام الطلب.', 'Any extra fees are confirmed at checkout.'],
    kEach: ['للقطعة', 'each'],

    /* checkout */
    xEye: ['إتمام الطلب', 'Checkout'], xH: ['بيانات التوصيل', 'Delivery details'],
    xS1: ['السلة', 'Cart'], xS2: ['البيانات', 'Details'], xS3: ['الملخص', 'Summary'],
    xName: ['الاسم الكامل', 'Full name'], xPhone: ['رقم الهاتف', 'Phone number'], xCity: ['المدينة', 'City'],
    xAddr: ['العنوان بالتفصيل', 'Full address'], xNotes: ['ملاحظات (اختياري)', 'Notes (optional)'],
    xPay: ['طريقة الدفع', 'Payment method'],
    xPlace: ['تأكيد الطلب', 'Confirm order'], xErr: ['يرجى تعبئة كل الحقول المطلوبة بشكل صحيح.', 'Please fill in all required fields correctly.'],
    xSum: ['ملخص السلة', 'Cart summary'], xBack: ['العودة للسلة', 'Back to cart'],
    xLoginH: ['سجّل دخولك لإتمام الطلب', 'Sign in to place your order'],
    xLogin: ['نحتاج حسابك لربط الطلب بك وتتبّعه لاحقاً.', 'We need your account to link the order to you and let you track it.'],

    /* receipt / orders */
    rH: ['شكراً لاختيارك كنعان', 'Thank you for choosing KANAAN'],
    rP: ['تم استلام طلبك وسيتواصل معك المتجر قريباً.', 'Your order has been received. The store will contact you soon.'],
    rNone: ['لا يوجد طلب لعرضه.', 'There is no order to show.'],
    rPrint: ['طباعة', 'Print'],
    rNo: ['رقم الطلب', 'Order no.'], rDate: ['التاريخ', 'Date'], rTo: ['التوصيل إلى', 'Deliver to'],
    rStatus: ['الحالة', 'Status'], rPay: ['الدفع', 'Payment'], rCod: ['الدفع عند الاستلام', 'Cash on delivery'],
    oH: ['طلباتي ومشترياتي', 'Orders & purchases'],
    oEmpty: ['لا توجد طلبات بعد. عند إتمام طلب سيظهر هنا.', 'No orders yet. Once you place one, it will appear here.'],
    stPending: ['قيد الانتظار', 'Pending'], stProcessing: ['قيد التجهيز', 'Processing'], stShipped: ['تم الشحن', 'Shipped'],
    stDelivered: ['تم التسليم', 'Delivered'], stCancelled: ['ملغي', 'Cancelled'],
    payUnpaid: ['غير مدفوع', 'Unpaid'], payPaid: ['مدفوع', 'Paid'],

    /* auth */
    aEye: ['حساب كنعان', 'Your KANAAN account'],
    aWelcome: ['مرحباً بعودتك', 'Welcome back'], aWelcomeP: ['سجّل دخولك لمتابعة تجربتك.', 'Sign in to continue your experience.'],
    aCreate: ['أنشئ حسابك', 'Create your account'], aCreateP: ['أنشئ حساباً لتتابع طلباتك وتحفظ مفضلتك.', 'Create an account to track your orders and save favourites.'],
    aArtH1: ['حكايتك', 'Your story'], aArtH2: ['تبدأ من هنا.', 'starts here.'],
    aArtP: ['انضم إلى مجتمع يحتفي بالحرفة والأصالة.', 'Join a community that celebrates craft and authenticity.'],
    aEmail: ['البريد الإلكتروني', 'Email address'], aPass: ['كلمة المرور', 'Password'],
    aPass2: ['تأكيد كلمة المرور', 'Confirm password'], aShow: ['إظهار', 'Show'], aHide: ['إخفاء', 'Hide'],
    aLogin: ['دخول', 'Sign in'], aReg: ['إنشاء الحساب', 'Create account'],
    aNoAcc: ['ليس لديك حساب؟', 'Don’t have an account?'], aHaveAcc: ['لديك حساب بالفعل؟', 'Already have an account?'],
    aMismatch: ['كلمتا المرور غير متطابقتين.', 'Passwords do not match.'],
    aB1: ['تتبّع طلباتك', 'Track your orders'], aB2: ['سلة محفوظة', 'A saved cart'], aB3: ['تجربة أسرع', 'Faster checkout'],

    /* account */
    dOut: ['تسجيل الخروج', 'Sign out'], dAdmin: ['لوحة الإدارة', 'Admin dashboard'],
    dGuestH: ['أهلاً بك في كنعان', 'Welcome to KANAAN'], dGuestP: ['سجّل دخولك لعرض حسابك وطلباتك.', 'Sign in to see your account and orders.'],

    /* profile */
    prH: ['مساحتك في كنعان', 'Your KANAAN space'],
    prSub: ['احتفظ ببياناتك وصورتك الشخصية في مكان واحد.', 'Keep your account details and profile photo in one place.'],
    prChoose: ['اختيار صورة', 'Choose photo'], prHint: ['JPG أو PNG أو WEBP — حتى 2MB', 'JPG, PNG or WEBP — up to 2MB'],
    prName: ['الاسم', 'Name'], prEmail: ['البريد الإلكتروني', 'Email'], prPhone: ['رقم الهاتف', 'Phone'],
    prNone: ['غير مضاف', 'Not added'], prSince: ['تاريخ الانضمام', 'Member since'],
    prGalEye: ['معرض صورك', 'Your photo gallery'], prGalH: ['صورك المرفوعة', 'Your uploaded photos'],
    prGalP: ['هذه الصور تظهر لك ولإدارة كنعان فقط.', 'These photos are visible to you and KANAAN administrators only.'],
    prAdd: ['＋ إضافة صورة', '＋ Add photo'],
    prEmpty: ['لم ترفع أي صور بعد. أضف أول صورة إلى معرضك.', 'No photos yet. Upload your first photo.'],
    prBad: ['اختر صورة JPG أو PNG أو WEBP بحجم أقل من 2MB.', 'Choose JPG, PNG or WEBP under 2MB.'],
    prUp: ['جاري رفع الصورة...', 'Uploading photo...'],
    prSaved: ['تم حفظ الصورة بنجاح.', 'Photo saved successfully.'],
    prGalDone: ['تم رفع الصورة، ويمكن للأدمن رؤيتها من لوحة الإدارة.', 'Photo uploaded. Admins can view it in the dashboard.'],
    prPhotoAlt: ['صورة الملف الشخصي', 'Profile photo'], prGalAlt: ['صورة مرفوعة', 'Uploaded account photo'],

    /* story */
    sEye: ['حكايتنا', 'Our story'], sH1: ['كل قطعة', 'Every piece'], sH2: ['تتذكّر من أين جاءت', 'remembers where it came from'],
    sLead: ['يجمع كنعان الحرف الفلسطينية اليدوية لمن يريد أكثر من مجرد غرض. نعمل مع حرفيين لتصل كل قطعة ومعها حكاية صانعها.', 'KANAAN brings Palestinian handmade crafts to people who want more than an object. We work with artisans so each piece carries its maker’s story.'],
    sP1: ['بدأنا كنعان لنمنح الحرفيين الفلسطينيين مكاناً يُرى فيه عملهم كما يستحق: الغرزة، والطين، والساعات التي تقف خلف كل قطعة.', 'We started KANAAN to give Palestinian artisans a place where their work is seen properly: the stitch, the clay, the hours behind every piece.'],
    sP2: ['كل ما في متجرنا صُنع يدوياً، ويأتي مع حكاية الحرفة التي ينتمي إليها. حين تشتري قطعة، فأنت تدعم من صنعها وتُبقي الحرفة حيّة.', 'Everything in our shop is handmade and comes with the story of the craft it belongs to. When you buy a piece, you support the person who made it and keep the craft alive.'],
    sPil: ['ما نؤمن به', 'What we stand for'],
    sK1: ['يدوي', 'Handmade'], sK1p: ['كل قطعة من صنع حرفي لا آلة، فلا قطعتان متطابقتان.', 'Each piece is made by an artisan, not a machine, so no two are the same.'],
    sK2: ['متجذّر', 'Rooted'], sK2p: ['زخارف التطريز والفخار تحمل تقاليد توارثتها العائلات.', 'Embroidery and pottery patterns carry traditions families have passed down.'],
    sK3: ['من فلسطين', 'From Palestine'], sK3p: ['شراؤك يدعم صانعي القطع ويُبقي الحرفة حيّة.', 'Your purchase supports the makers and keeps the craft alive.'],
    sQuote: ['تبقى الحرفة حيّة ما دام هناك من يواصل صنعها.', 'A craft survives as long as someone keeps making it.'],
    sCta: ['احمل حكاية إلى بيتك', 'Bring a story home'],

    /* craft pages */
    crShop: ['تسوّق القطع', 'Shop the pieces'], crAll: ['كل الحرف', 'All crafts'], crCare: ['العناية بقطعتك', 'Caring for your piece'],
    crNone: ['لا توجد قطع في هذه الفئة حالياً.', 'No pieces in this category right now.'],
    eEye: ['حرفة', 'Craft'], eH1: ['التطريز', 'Palestinian'], eH2: ['الفلسطيني', 'embroidery'],
    eLead: ['التطريز فنّ الغرزة المعدودة. كل زخرفة تُحاك يدوياً غرزةً بعد غرزة، ولكل نقش اسمه ومكانه في التراث.', 'Tatreez is the art of the counted stitch. Every motif is sewn by hand, one cross at a time, and each pattern has its own name and place in the tradition.'],
    eM: ['عن الحرفة', 'About the craft'],
    eM1: ['غرزة بغرزة', 'Stitch by stitch'], eM1p: ['كل غرزة صليب توضع على حدة، لذا تحتاج كل قطعة وقتاً حقيقياً.', 'Every cross-stitch is placed individually, so each piece takes real time.'],
    eM2: ['نقوش لها أسماء', 'Patterns with names'], eM2p: ['تنتقل الزخارف من مطرِّزة إلى أخرى وتتكرر في قطع جديدة.', 'Motifs pass from one embroiderer to the next and live on in new pieces.'],
    eM3: ['لتُستخدم', 'Made to be used'], eM3p: ['من الإكسسوارات اليومية إلى الهدايا، صُنعت لتُلبس وتُحفظ.', 'From everyday accessories to gifts, made to be worn and kept.'],
    eP: ['قطع التطريز', 'Embroidered pieces'],
    eC1: ['اغسلها بلطف', 'Wash gently'], eC1p: ['غسيل يدوي بصابون خفيف وماء بارد.', 'Hand wash with mild soap and cool water.'],
    eC2: ['جفّفها مفروشة', 'Dry flat'], eC2p: ['بعيداً عن أشعة الشمس المباشرة.', 'Away from direct sunlight.'],
    eC3: ['اكوِها من الخلف', 'Iron on the back'], eC3p: ['بحرارة منخفضة لتبقى الغرز بارزة.', 'On low heat so the stitches stay raised.'],
    pH1: ['فخار', 'Handmade'], pH2: ['صُنع بالأيدي', 'pottery'],
    pLead: ['يُشكَّل الطين باليد، ويُحرق، ويُنهى قطعةً قطعة. والفروق الصغيرة جزء مما يجعله يدوياً.', 'Clay is shaped by hand, fired, and finished one piece at a time. Small differences are part of what makes it handmade.'],
    pStepsH: ['من الطين إلى مائدتك', 'From clay to table'],
    pS1: ['التشكيل', 'Shaping'], pS1p: ['يُشكَّل الطين باليد على الدولاب أو بدونه.', 'The clay is shaped by hand, on the wheel or off it.'],
    pS2: ['التجفيف', 'Drying'], pS2p: ['تُترك القطعة لتجف ببطء قبل الحرق.', 'The piece dries slowly before firing.'],
    pS3: ['الحرق', 'Firing'], pS3p: ['تتصلّب القطعة في الفرن وتأخذ لونها.', 'The piece hardens in the kiln and takes its colour.'],
    pS4: ['اللمسة الأخيرة', 'Finishing'], pS4p: ['تُزخرف وتُنهى يدوياً لتصل إليك.', 'It is decorated and finished by hand before reaching you.'],
    pPP: ['قطع الفخار', 'Pottery pieces'],
    pC1: ['اغسلها بلطف', 'Wash gently'], pC1p: ['بيدك وبإسفنجة ناعمة.', 'By hand with a soft sponge.'],
    pC2: ['تجنّب التغيّر المفاجئ', 'Avoid sudden changes'], pC2p: ['أبعدها عن تبدّلات الحرارة المفاجئة.', 'Keep it away from sudden temperature changes.'],
    pC3: ['تعامل برفق', 'Handle with care'], pC3p: ['القطع اليدوية قد تتشقق إن سقطت.', 'Handmade pieces can chip if dropped.']
};

// جلب النص حسب اللغة: t('add') => "أضف إلى السلة" أو "Add to cart"
function t(key) {
    const pair = TEXT[key];
    if (!pair) return key;   // ما في ترجمة: نرجّع المفتاح نفسه
    if (isArabic()) return pair[0];
    return pair[1];
}


/* =====================================================================
   3) دوال مساعدة
===================================================================== */

// رابط داخل المشروع
function U(path) {
    return BASE + path;
}

// يرجّع html إذا الشرط صحيح، وإلا نص فاضي (عشان نكتب الشروط داخل القوالب بسهولة)
function when(condition, html) {
    if (condition) return html;
    return '';
}

// حماية من XSS: نحوّل الرموز الخاصة قبل ما نعرض أي نص
function esc(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(text ?? '').replace(/[&<>"']/g, ch => map[ch]);
}

// المبلغ: 12.50 د.أ  أو  JOD 12.50
const numberFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function money(n) {
    const formatted = numberFormat.format(+n || 0);
    if (isArabic()) return formatted + ' د.أ';
    return 'JOD ' + formatted;
}

// التاريخ (أرقام لاتينية حتى بالعربي)
function formatDate(s) {
    const date = new Date(String(s).replace(' ', 'T'));   // صيغة MySQL => ISO
    let locale = 'en-GB';
    if (isArabic()) locale = 'ar-JO-u-nu-latn';
    return date.toLocaleDateString(locale);
}

/* ---------- الصور ---------- */

const IMAGES = {
    tatreez: 'https://handmadepalestine.com/cdn/shop/files/IMG_2816_6e10ba4f-7202-44bc-8155-63c839c2e4c3.jpg?v=1770279932&width=1200',
    coasters: 'https://handmadepalestine.com/cdn/shop/files/47FE90A0-EDAC-4508-A01A-0E929365307B.jpg?v=1754750565',
    jewelry: 'https://www.shoppalestine.org/cdn/shop/collections/jewelry.jpg?v=1679682706',
    soap: 'https://www.annadwa.org/wp-content/uploads/2025/08/azz211-1.webp',
    gift: 'https://handmadepalestine.com/cdn/shop/collections/IMG_8425_-_gift_set___tatreez_card_holder.jpg?crop=center&height=1200&v=1744626698&width=1200',
    wood: 'https://talleh.com/storage/resized/MTAwLXJhbWFsbGFoLTAyMTc2MDk1MTY2NjA5Mzc3OGRiLWRmMDktNGU1Yy1hNGRiLWZmYzYwMjA5NGVmMA%3D%3D_1000x600_95.webp',
    ceramic: 'https://cdn.shopify.com/s/files/1/0943/9798/9176/files/Untitled_1024_x_1024_px_3.webp?v=1776679255'
};

// صورة بديلة حسب نوع المنتج (إذا المنتج ما إله صورة مرفوعة)
const IMAGE_RULES = [
    { pattern: /تطريز|وسادة|tatreez|embroid/i, image: IMAGES.tatreez },
    { pattern: /فخار|خزف|إبريق|سيراميك|ceramic|pottery/i, image: IMAGES.ceramic },
    { pattern: /صابون|soap/i, image: IMAGES.soap },
    { pattern: /خشب|زيتون|wood|olive/i, image: IMAGES.wood },
    { pattern: /مجوهر|حلي|jewel/i, image: IMAGES.jewelry },
    { pattern: /هدية|هدايا|gift/i, image: IMAGES.gift }
];

// أسماء التصنيفات بالإنجليزي
const CATEGORY_NAMES_EN = [
    { pattern: /تطريز/, name: 'Palestinian Embroidery' },
    { pattern: /فخار|خزف|سيراميك/, name: 'Pottery & Ceramics' },
    { pattern: /صابون/, name: 'Nabulsi Soap' },
    { pattern: /خشب/, name: 'Olive Wood' },
    { pattern: /هدايا|هدية/, name: 'Gifts & Accessories' },
    { pattern: /مجوهر|حلي/, name: 'Jewelry' }
];

// رابط الصورة: الرابط الكامل زي ما هو، والباقي ملفات مرفوعة بتمر عن طريق الـ API
function imgSrc(path) {
    if (/^(https?:|data:)/.test(path)) return path;
    const cleanPath = String(path).replace(/^\//, '');   // نشيل أول سلاش
    return API + '?action=img&path=' + encodeURIComponent(cleanPath);
}

// صورة المنتج: المرفوعة، وإلا حسب النوع، وإلا صورة افتراضية
function imageFor(product) {
    const p = product || {};
    if (p.image) return imgSrc(p.image);

    const text = (p.category_name || '') + ' ' + (p.name || '');
    for (const rule of IMAGE_RULES) {
        if (rule.pattern.test(text)) return rule.image;
    }
    return IMAGES.coasters;
}

// اسم التصنيف حسب اللغة
function categoryLabel(name) {
    const categoryName = name || '';
    if (isArabic()) return categoryName || 'حرفة فلسطينية';

    for (const item of CATEGORY_NAMES_EN) {
        if (item.pattern.test(categoryName)) return item.name;
    }
    return categoryName || 'Palestinian Craft';
}

// وسم صورة (وإذا فشلت بنعرض الصورة البديلة؛ نشيل onerror أول عشان ما يعلق بحلقة)
function imgTag(src, alt = '') {
    return `<img loading="lazy" src="${esc(src)}" alt="${esc(alt)}" onerror="this.onerror=null;this.src='${PLACEHOLDER}'">`;
}

/* ---------- الأيقونات ---------- */

function icon(path, size = 22) {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

const ICONS = {
    user: icon('<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.6-3.6 3.4-5.6 7-5.6s6.4 2 7 5.6"/>'),
    bag: icon('<path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>'),
    globe: icon('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8-3-2.8 15 0 18"/>', 20),
    menu: icon('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    close: icon('<path d="M6 6l12 12M18 6L6 18"/>'),
    trash: icon('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6"/>', 18),
    plus: icon('<path d="M12 5v14M5 12h14"/>', 16),
    minus: icon('<path d="M5 12h14"/>', 16),
    arrow: icon('<path d="M5 12h14M13 6l6 6-6 6"/>', 18),
    check: icon('<path d="M5 12l5 5 9-10"/>', 18)
};

const ARROW_SPAN = `<span class="arr">${ICONS.arrow}</span>`;


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

    const options = { credentials: 'same-origin' };   // يرسل الكوكيز (الجلسة)
    if (body instanceof FormData) {
        options.method = 'POST';
        options.body = body;                          // المتصفح بحط الـ header لحاله
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
        throw new Error(t('errSrv'));   // الرد مش JSON (مثلاً PHP طلّع خطأ HTML)
    }

    if (!response.ok) {
        const message = (lang === 'en' && data.error_en) || data.error || t('errGen');
        throw new Error(message);
    }
    return data;
}

// نجيب التصنيفات ونحفظها (بتنستخدم بالرئيسية والكتالوج وصفحات الحرف)
async function loadCategories() {
    const res = await api('categories');
    categories = res.items || [];
    return categories;
}

// نحدّث عدد السلة والمستخدم (حتى لو طلب فشل، الثاني بكمّل)
async function refreshState() {
    const results = await Promise.allSettled([api('cart'), api('me')]);
    const cartResult = results[0];
    const meResult = results[1];

    cartCount = 0;
    currentUser = null;
    if (cartResult.status === 'fulfilled') cartCount = cartResult.value.count || 0;
    if (meResult.status === 'fulfilled') currentUser = meResult.value.user || null;

    paintTools();
}

// رسالة صغيرة بتظهر وبتختفي لحالها
let toastTimer;
function toast(message, isError) {
    let el = $('#toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'toast';
        el.setAttribute('role', 'status');
        document.body.appendChild(el);
    }
    el.textContent = message;
    el.className = isError ? 'show bad' : 'show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = ''; }, 2600);
}

// إضافة منتج للسلة: بترجّع true إذا نجحت
async function addToCart(id, qty = 1) {
    try {
        await api('cart-add', {}, { id: +id, qty: qty });
        await refreshState();
        toast(t('added'));
        return true;
    } catch (e) {
        toast(e.message, true);
        return false;
    }
}

// منتجات أول تصنيف اسمه بطابق الـ regex (لصفحات التطريز والفخار)
async function productsByCategory(pattern) {
    try {
        if (!categories.length) await loadCategories();

        let found = null;
        for (const c of categories) {
            if (pattern.test(c.name)) {
                found = c;
                break;
            }
        }
        if (!found) return { id: 0, items: [] };

        const res = await api('products', { category: found.id });
        return { id: found.id, items: res.items || [] };
    } catch (e) {
        return { id: 0, items: [] };
    }
}


/* =====================================================================
   5) الهيدر والفوتر
===================================================================== */

// عناصر القائمة: [مفتاح الصفحة، الملف، مفتاح النص]
const NAV = [
    ['home', 'index.html', 'nHome'],
    ['catalog', 'catalog.html', 'nShop'],
    ['embroidery', 'embroidery.html', 'nEmb'],
    ['pottery', 'pottery.html', 'nPot'],
    ['story', 'story.html', 'nStory']
];

function brandHTML(className = 'brand') {
    return `
    <a class="${className}" href="${U('index.html')}">
        <span class="brand-mark">${t('mark')}</span>
        <span><b>KANAAN</b><small>${t('tagline')}</small></span>
    </a>`;
}

function paintHeader() {
    const host = $('#site-header');
    if (!host) return;

    let navLinks = '';
    for (const item of NAV) {
        navLinks += `<a data-nav="${item[0]}" href="${U(item[1])}">${t(item[2])}</a>`;
    }

    host.innerHTML = `
        <div class="topline"><div class="container topinner"><span>${t('top1')}</span><span>${t('top2')}</span></div></div>
        <header class="site-header">
            <div class="container nav">
                <button class="tool menu-toggle" id="menu-toggle" type="button" aria-label="${t('menu')}" aria-expanded="false">${ICONS.menu}</button>
                ${brandHTML()}
                <nav class="main-nav" id="main-nav">${navLinks}</nav>
                <div class="nav-tools">
                    <a class="tool admin-shortcut" id="admin-shortcut" href="${U('admin/dashboard.html')}" hidden>✦ ${t('dAdmin')}</a>
                    <button class="tool lang-btn" id="lang-btn" type="button" aria-label="${t('langAria')}">${ICONS.globe}<span>${t('langTo')}</span></button>
                    <div class="acct" id="acct"></div>
                    <a class="tool cart-btn" id="cart-link" href="${U('cart.html')}" aria-label="${t('cartL')}">${ICONS.bag}<span class="tool-label">${t('cartL')}</span><i id="cart-count" hidden>0</i></a>
                </div>
            </div>
        </header>`;

    paintTools();
    paintNav();
}

// تحديث عدّاد السلة + زر الأدمن + قائمة الحساب
function paintTools() {
    const badge = $('#cart-count');
    if (badge) {
        badge.textContent = cartCount;
        badge.hidden = !cartCount;
    }

    const adminShortcut = $('#admin-shortcut');
    if (adminShortcut) adminShortcut.hidden = !isAdmin();

    const box = $('#acct');
    if (!box) return;

    // مش مسجّل دخول
    if (!currentUser) {
        box.innerHTML = `<a class="tool tool-login" href="${U('login.html')}" aria-label="${t('signIn')}">${ICONS.user}<span class="tool-label">${t('signIn')}</span></a>`;
        return;
    }

    // مسجّل دخول
    const firstName = esc(String(currentUser.name || t('myAcc')).split(' ')[0]);
    const adminItem = when(isAdmin(), `<a href="${U('admin/dashboard.html')}">${t('dAdmin')}</a>`);

    box.innerHTML = `
        <button class="tool tool-login" id="acct-btn" type="button" aria-haspopup="true" aria-expanded="false">${ICONS.user}<span class="tool-label">${firstName}</span></button>
        <div class="acct-menu" id="acct-menu" hidden>
            <small>${esc(currentUser.name || '')}</small>
            <a href="${U('customer/profile.html')}">${t('fProfile')}</a>
            <a href="${U('customer/orders.html')}">${t('fOrders')}</a>
            ${adminItem}
            <button type="button" id="logout">${t('dOut')}</button>
        </div>`;
}

// نلوّن رابط الصفحة الحالية بالقائمة
function paintNav() {
    const page = document.body.dataset.page;
    for (const link of $$('#main-nav a')) {
        link.classList.toggle('active', link.dataset.nav === page);
    }
}

// عمود بالفوكتر: عنوان + روابط [[ملف، مفتاح نص], ...]
function footerLinks(titleKey, links) {
    let html = `<h4>${t(titleKey)}</h4>`;
    for (const link of links) {
        html += `<a href="${U(link[0])}">${t(link[1])}</a>`;
    }
    return `<div>${html}</div>`;
}

function paintFooter() {
    const host = $('#site-footer');
    if (!host) return;

    const discover = footerLinks('fDisc', [
        ['catalog.html', 'fAll'],
        ['story.html', 'nStory'],
        ['customer/orders.html', 'fOrders']
    ]);
    const service = footerLinks('fServ', [
        ['cart.html', 'fCart'],
        ['login.html', 'signIn'],
        ['register.html', 'fReg']
    ]);

    host.innerHTML = `
        <footer class="site-footer">
            <div class="container footer-grid">
                <div>${brandHTML('brand footer-brand')}<p>${t('fAbout')}</p></div>
                ${discover}
                ${service}
                <div><h4>${t('fTouch')}</h4><p>${t('fTouchP')}</p><span class="footer-note">${t('madeIn')}</span></div>
            </div>
            <div class="copyright">${t('rights')}</div>
        </footer>`;
}

// اللغة واتجاه الصفحة
function applyDocumentLang() {
    document.documentElement.lang = lang;
    if (isArabic()) {
        document.documentElement.dir = 'rtl';
    } else {
        document.documentElement.dir = 'ltr';
    }
}

// تبديل اللغة بدون إعادة تحميل
function setLang(newLang) {
    lang = newLang;
    storeSet('kn_lang', newLang);
    applyDocumentLang();
    paintHeader();
    paintFooter();
    render(true);
}


/* =====================================================================
   6) مكونات صغيرة مشتركة (كل وحدة بترجّع HTML)
===================================================================== */

// كرت منتج
function productCard(p) {
    const href = U('product-detail.html?id=' + encodeURIComponent(p.id));
    const soldOut = Number(p.stock) < 1;

    return `
    <article class="pcard${when(soldOut, ' soldout')}">
        <a class="pcard-img" href="${href}">${imgTag(imageFor(p), p.name)}${when(soldOut, `<span class="pcard-flag">${t('sold')}</span>`)}</a>
        <div class="pcard-body">
            <span class="pcard-cat">${esc(categoryLabel(p.category_name))}</span>
            <h3><a href="${href}">${esc(p.name)}</a></h3>
            <div class="pcard-foot">
                <b>${money(p.price)}</b>
                <button class="add-quick" type="button" data-add="${p.id}" ${when(soldOut, 'disabled')} aria-label="${t('add')}">${ICONS.bag}</button>
            </div>
        </div>
    </article>`;
}

// شبكة منتجات (وإذا فاضية بنعرض رسالة emptyKey)
function productGrid(items, emptyKey) {
    let cardsHtml = items.map(productCard).join('');
    if (!cardsHtml) cardsHtml = `<p class="muted">${t(emptyKey)}</p>`;
    return `<div class="grid">${cardsHtml}</div>`;
}

// عنوان قسم (eyebrow اختياري + رابط اختياري)
function sectionHead(eyebrow, title, link = '') {
    const eyebrowHtml = when(eyebrow, `<span class="eyebrow">${eyebrow}</span>`);
    return `<div class="sec-head"><div>${eyebrowHtml}<h2>${title}</h2></div>${link}</div>`;
}

function viewAllLink() {
    return `<a class="link-line" href="${U('catalog.html')}">${t('viewAll')}</a>`;
}

// قسم منتجات كامل (بالرئيسية وصفحات الحرف)
function shopSection(className, eyebrow, title, items, emptyKey, link = '') {
    return `
    <section class="${className}"><div class="container section">
        ${sectionHead(eyebrow, title, link)}
        ${productGrid(items, emptyKey)}
    </div></section>`;
}

// قسم "العناية بقطعتك" (التطريز والفخار)
function careSection(className, prefix) {
    return `
    <section class="${className} container section">
        ${sectionHead('', t('crCare'))}
        <div class="care">${cards(prefix)}</div>
    </section>`;
}

// n بطاقات بنصوص مرقّمة: prefix='sK' => sK1/sK1p ، sK2/sK2p ، ...
// (الحرف p = الفقرة الوصفية)
function cards(prefix, tag = 'article', count = 3) {
    let html = '';
    for (let i = 1; i <= count; i++) {
        html += `<${tag}><h3>${t(prefix + i)}</h3><p>${t(prefix + i + 'p')}</p></${tag}>`;
    }
    return html;
}

// قائمة بعلامة صح (ميزات المنتج، مزايا التسجيل)
function checkList(keys, className) {
    let items = '';
    for (const key of keys) {
        items += `<li>${ICONS.check}${t(key)}</li>`;
    }
    return `<ul class="${className}">${items}</ul>`;
}

// صندوق "فاضي" مع زر اختياري
function emptyBox(title, text, button = '') {
    return `
    <div class="empty">
        <div class="empty-ic">${ICONS.bag}</div>
        <h2>${title}</h2>
        ${when(text, `<p>${text}</p>`)}
        ${button}
    </div>`;
}

// زر "متابعة التسوق" (بنستخدمه بأكثر من مكان)
function shopButton() {
    return `<a class="btn btn-dark" href="${U('catalog.html')}">${t('continueShop')}</a>`;
}

// عدّاد الكمية (+ / -)
function stepper(id, value, max) {
    return `
    <div class="stepper" data-step-for="${id}">
        <button type="button" data-step="-1" aria-label="-">${ICONS.minus}</button>
        <input id="qty-${id}" type="number" min="1" max="${max}" value="${value}" inputmode="numeric" aria-label="${t('qty')}">
        <button type="button" data-step="1" aria-label="+">${ICONS.plus}</button>
    </div>`;
}

// رسالة للزائر: "سجّل دخول أو أنشئ حساب" (ونحفظ وين كان رايح)
function guestPrompt(wrapClass, title, text, nextPage) {
    storeSet('kn_next', nextPage);
    const buttons = `
        <div class="d-btns">
            <a class="btn btn-dark" href="${U('login.html')}">${t('signIn')}</a>
            <a class="btn btn-ghost" href="${U('register.html')}">${t('fReg')}</a>
        </div>`;
    return `<section class="container ${wrapClass}">${emptyBox(title, text, buttons)}</section>`;
}

// شارة حالة الطلب: status = Pending / Processing / ...
function statusChip(status) {
    return `<b class="st st-${esc(status)}">${t('st' + status)}</b>`;
}

// كرت تفاصيل الطلب
function orderCard(o) {
    let lines = '';
    for (const item of o.items || []) {
        lines += `<div class="r-line"><span>${esc(item.product_name)} × ${item.quantity}</span><b>${money(item.unit_price * item.quantity)}</b></div>`;
    }

    return `
    <div class="r-paper">
        <div class="r-meta"><span>${t('rNo')}: <b>#${esc(o.id)}</b></span><span>${t('rDate')}: <b>${formatDate(o.created_at)}</b></span></div>
        <div class="r-meta"><span>${t('rStatus')}: ${statusChip(o.status)}</span><span>${t('rPay')}: <b>${t('pay' + o.payment_status)} · ${t('rCod')}</b></span></div>
        <div class="r-to"><span>${t('rTo')}</span><b>${esc(o.full_name)} · ${esc(o.phone)}</b><small>${esc(o.city)}, ${esc(o.address)}</small></div>
        ${lines}
        <div class="r-line r-total"><span>${t('total')}</span><b>${money(o.total)}</b></div>
        ${when(o.notes, `<small class="muted">${t('notes')}: ${esc(o.notes)}</small>`)}
        <div class="r-actions"><button class="btn btn-ghost" type="button" data-print>${t('rPrint')}</button></div>
    </div>`;
}

// زرّين لصفحات الحرف: تسوّق هالتصنيف / تسوّق الكل
function craftButtons(categoryId) {
    let shopUrl = U('catalog.html');
    if (categoryId) shopUrl += '?category=' + categoryId;

    return `
    <div class="d-btns">
        <a class="btn btn-primary" href="${shopUrl}">${t('crShop')}</a>
        <a class="btn btn-ghost" href="${U('catalog.html')}">${t('crAll')}</a>
    </div>`;
}

// رفع صورة: نتأكد من النوع والحجم، نرسلها للسيرفر، وبعدين ننادي onDone(النتيجة)
function bindUpload(input, messageEl, action, onDone) {
    input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;

        if (!IMAGE_TYPES.includes(file.type) || file.size > MAX_UPLOAD) {
            messageEl.textContent = t('prBad');
            return;
        }

        const formData = new FormData();
        formData.append('image', file);
        messageEl.textContent = t('prUp');

        try {
            const result = await api(action, {}, formData);
            await onDone(result);
            input.value = '';
        } catch (e) {
            messageEl.textContent = e.message;
        }
    };
}


/* =====================================================================
   7) الصفحات
   كل صفحة بترجّع كائن: { html, bind?, redirect? }
   - html: محتوى الصفحة
   - bind: دالة بتربط الأزرار بعد ما HTML ينحط
   - redirect: اسم صفحة نحوّل لها بدل ما نعرض شي
===================================================================== */

/* ---------- الرئيسية ---------- */
function categoryCard(c) {
    return `
    <a class="h-cat" href="${U('catalog.html?category=' + c.id)}">
        ${imgTag(imageFor({ name: c.name, image: c.image }), c.name)}
        <span><b>${esc(categoryLabel(c.name))}</b><i>${t('explore')}</i></span>
    </a>`;
}

async function vHome() {
    const results = await Promise.all([loadCategories(), api('products')]);
    const products = (results[1].items || []).slice(0, 8);
    const collections = categories.slice(0, 3).map(categoryCard).join('');

    const html = `
        <section class="h-hero">
            <video class="h-video" src="${VIDEO}" poster="${IMAGES.tatreez}" autoplay muted loop playsinline preload="metadata"></video>
            <div class="h-shade"></div>
            <div class="container h-inner">
                <span class="eyebrow">${t('hEye')}</span>
                <h1>${t('hH1')}<br><em>${t('hH2')}</em></h1>
                <p>${t('hP')}</p>
                <div class="h-actions">
                    <a class="btn btn-primary" href="${U('catalog.html')}">${t('hCta')}${ARROW_SPAN}</a>
                    <a class="btn btn-ghost-light" href="${U('story.html')}">${t('hStory')}</a>
                </div>
            </div>
            <div class="h-stamp">${t('hStamp')}</div>
        </section>
        <section class="container h-strip"><span>${t('hS1')}</span><span>${t('hS2')}</span><span>${t('hS3')}</span></section>
        <section class="container section">
            ${sectionHead(t('hColEye'), t('hCol'), viewAllLink())}
            <div class="h-cats">${collections}</div>
        </section>
        ${shopSection('h-products', t('hPickEye'), t('hPick'), products, 'hNone', viewAllLink())}
        <section class="h-story">
            <div class="h-story-img">${imgTag(IMAGES.gift)}</div>
            <div class="h-story-copy">
                <span class="eyebrow">${t('hStEye')}</span>
                <h2>${t('hStH')}<br><em>${t('hStH2')}</em></h2>
                <p>${t('hStP')}</p>
                <a class="btn btn-dark" href="${U('story.html')}">${t('hStory')}${ARROW_SPAN}</a>
                <div class="h-sign">${t('hStSign')}</div>
            </div>
        </section>
        <section class="h-quote"><p>${t('hQuote')}</p><small>KANAAN</small></section>`;

    function bind() {
        // إذا المستخدم مفعّل "تقليل الحركة" نوقف الفيديو
        const video = $('.h-video');
        if (video && matchMedia('(prefers-reduced-motion: reduce)').matches) video.pause();
    }

    return { html: html, bind: bind };
}

/* ---------- الكتالوج (بحث + تصنيف + ترتيب) ---------- */
async function vCatalog(params) {
    // الفلاتر الحالية (من الرابط)
    const filters = {
        category: params.get('category') || '',
        q: params.get('q') || '',
        sort: params.get('sort') || 'new'
    };

    const results = await Promise.all([
        loadCategories(),
        api('products', { q: filters.q, category: filters.category })
    ]);
    let items = results[1].items || [];

    // نسخة مرتّبة من المنتجات (الترتيب بالمتصفح، مش بالسيرفر)
    function sortedItems() {
        const list = [...items];
        if (filters.sort === 'low') list.sort((a, b) => a.price - b.price);
        if (filters.sort === 'high') list.sort((a, b) => b.price - a.price);
        return list;
    }

    // رابط الكتالوج بالفلاتر الحالية، مع إمكانية تغيير بعضها
    function urlFor(changes = {}) {
        const all = Object.assign({}, filters, changes);
        const query = new URLSearchParams();
        for (const key in all) {
            const value = all[key];
            if (!value) continue;                              // نتجاهل الفاضي
            if (key === 'sort' && value === 'new') continue;   // 'new' هو الافتراضي
            query.set(key, value);
        }
        const text = query.toString();
        if (text) return U('catalog.html') + '?' + text;
        return U('catalog.html');
    }

    function gridHTML() {
        const html = sortedItems().map(productCard).join('');
        if (html) return html;
        return `<p class="empty-line">${t('cNone')}</p>`;
    }

    function isActiveCategory(id) {
        return String(filters.category) === String(id);
    }

    function sortOption(value, textKey) {
        return `<option value="${value}" ${when(filters.sort === value, 'selected')}>${t(textKey)}</option>`;
    }

    function chip(id, label) {
        return `<a class="chip ${when(isActiveCategory(id), 'active')}" data-category="${esc(id)}" href="${urlFor({ category: id })}">${label}</a>`;
    }

    let chips = chip('', t('cAll'));
    for (const c of categories) {
        chips += chip(c.id, esc(categoryLabel(c.name)));
    }

    const html = `
        <section class="c-head container">
            <span class="eyebrow">${t('cEye')}</span>
            <h1>${t('cH')}</h1>
            <p class="c-count" id="catalog-count">${items.length} ${t('cCount')}</p>
        </section>
        <section class="container c-tools">
            <form class="c-search" id="c-search">
                <input name="q" type="search" value="${esc(filters.q)}" placeholder="${t('cSearch')}" aria-label="${t('cGo')}">
                <button class="btn btn-dark" type="submit">${t('cGo')}</button>
            </form>
            <select id="c-sort" aria-label="sort">
                ${sortOption('new', 'sNew')}${sortOption('low', 'sLow')}${sortOption('high', 'sHigh')}
            </select>
        </section>
        <nav class="container chips" id="catalog-chips" aria-label="categories">${chips}</nav>
        <section class="container c-grid-wrap">
            <div class="grid grid-3 catalog-products" id="catalog-products">${gridHTML()}</div>
        </section>`;

    function bind() {
        const form = $('#c-search');
        const input = $('input[name="q"]', form);
        const select = $('#c-sort');
        const chipsBox = $('#catalog-chips');
        const grid = $('#catalog-products');
        const count = $('#catalog-count');
        let requestId = 0;   // رقم لكل طلب بحث

        // نحدّث الرابط بشريط العنوان بدون إعادة تحميل ولا سجل جديد
        function syncAddress() {
            history.replaceState(history.state, '', urlFor());
        }

        function paintCount() {
            count.textContent = items.length + ' ' + t('cCount');
        }

        function paintGrid() {
            grid.innerHTML = gridHTML();
            grid.classList.remove('is-filtering', 'filter-updated');
            void grid.offsetWidth;   // حيلة: بتجبر المتصفح يعيد حساب التصميم عشان الأنيميشن يبدأ من جديد
            grid.classList.add('filter-updated');
            paintCount();
        }

        function paintChips() {
            for (const link of $$('[data-category]', chipsBox)) {
                const active = isActiveCategory(link.dataset.category);
                link.classList.toggle('active', active);
                if (active) {
                    link.setAttribute('aria-current', 'true');
                } else {
                    link.removeAttribute('aria-current');
                }
            }
        }

        // نجيب المنتجات من جديد بعد تغيير البحث أو التصنيف
        async function reload(changes) {
            Object.assign(filters, changes);
            input.value = filters.q;
            select.value = filters.sort;
            paintChips();
            syncAddress();

            requestId++;
            const myRequest = requestId;
            grid.classList.add('is-filtering');

            try {
                const res = await api('products', { q: filters.q, category: filters.category });
                if (myRequest !== requestId) return;   // في طلب أحدث، نتجاهل هاد الرد القديم
                items = res.items || [];
                paintGrid();
            } catch (err) {
                if (myRequest !== requestId) return;
                grid.classList.remove('is-filtering');
                grid.innerHTML = `<p class="empty-line">${esc(err.message || t('errGen'))}</p>`;
                items = [];
                paintCount();
            }
        }

        form.addEventListener('submit', e => {
            e.preventDefault();
            reload({ q: input.value.trim() });
        });

        select.addEventListener('change', () => {
            filters.sort = select.value;
            syncAddress();
            paintGrid();   // الترتيب بالمتصفح
        });

        chipsBox.addEventListener('click', e => {
            const link = e.target.closest('a[data-category]');
            if (!link) return;
            e.preventDefault();
            reload({ category: link.dataset.category });
        });
    }

    return { html: html, bind: bind };
}

/* ---------- صفحة المنتج ---------- */
async function vProduct(params) {
    const p = (await api('product', { id: params.get('id') })).item;

    // منتجات مشابهة (من نفس التصنيف، بدون المنتج نفسه)
    let related = [];
    try {
        const res = await api('products', { category: p.category_id });
        related = (res.items || []).filter(x => x.id != p.id).slice(0, 4);
    } catch (e) { }

    const soldOut = Number(p.stock) < 1;
    const max = Math.max(1, Number(p.stock) || 1);

    // قسم الحرفي (إذا موجود)
    let artisan = '';
    if (p.artisan_name) {
        artisan = `
        <div class="p-artisan">
            <span class="eyebrow">${t('pArt')}</span><b>${esc(p.artisan_name)}</b>
            ${when(p.artisan_story, `<p>${esc(p.artisan_story)}</p>`)}
        </div>`;
    }

    let stockText = '—';
    if (p.stock != null) stockText = p.stock;

    let relatedHtml = '';
    if (related.length) {
        relatedHtml = `<section class="container section p-rel">${sectionHead('', t('pRel'))}<div class="grid">${related.map(productCard).join('')}</div></section>`;
    }

    const html = `
        <section class="container p-wrap">
            <div class="p-gallery"><div class="p-frame">${imgTag(imageFor(p), p.name)}</div></div>
            <div class="p-info">
                <nav class="crumbs"><a href="${U('index.html')}">${t('nHome')}</a> / <a href="${U('catalog.html')}">${t('pShop')}</a> / ${esc(p.name)}</nav>
                <span class="eyebrow">${esc(categoryLabel(p.category_name))}</span>
                <h1>${esc(p.name)}</h1>
                <div class="p-price">${money(p.price)}</div>
                <p class="p-desc">${esc(p.description || t('pDescDef'))}</p>
                ${checkList(['pF1', 'pF2', 'pF3'], 'p-facts')}
                ${artisan}
                <div class="p-buy">
                    ${stepper(p.id, 1, max)}
                    <button class="btn btn-primary" id="p-add" type="button" ${when(soldOut, 'disabled')}>${soldOut ? t('sold') : t('add')}</button>
                    <button class="btn btn-ghost" id="p-now" type="button" ${when(soldOut, 'disabled')}>${t('pBuy')}</button>
                </div>
                <small class="muted">${t('pStock')}: ${esc(stockText)}</small>
            </div>
        </section>
        ${relatedHtml}`;

    function bind() {
        // الكمية لازم تكون بين 1 وأقصى مخزون (إذا المدخل مش رقم نرجع 1)
        function getQty() {
            const value = parseInt($('#qty-' + p.id).value, 10) || 1;
            return Math.min(max, Math.max(1, value));
        }

        $('#p-add').onclick = () => addToCart(p.id, getQty());

        // "اشترِ الآن": نضيف للسلة وإذا نجحت نروح للدفع
        $('#p-now').onclick = async () => {
            const ok = await addToCart(p.id, getQty());
            if (ok) nav('checkout.html');
        };
    }

    return { html: html, bind: bind };
}

/* ---------- السلة ---------- */
function cartRow(x) {
    const href = U('product-detail.html?id=' + x.id);
    return `
    <div class="l-row">
        <a class="l-thumb" href="${href}">${imgTag(imageFor(x), x.name)}</a>
        <div class="l-name"><a href="${href}">${esc(x.name)}</a><small>${money(x.price)} ${t('kEach')}</small></div>
        <div class="stepper sm" data-line="${x.id}" data-stock="${x.stock}" data-qty="${x.qty}">
            <button type="button" data-chg="-1" aria-label="-">${ICONS.minus}</button><span>${x.qty}</span><button type="button" data-chg="1" aria-label="+">${ICONS.plus}</button>
        </div>
        <span class="l-dots"></span>
        <b class="l-sub">${money(x.subtotal)}</b>
        <button class="l-del" type="button" data-del="${x.id}" aria-label="${t('remove')}">${ICONS.trash}</button>
    </div>`;
}

async function vCart() {
    const cart = await api('cart');
    const items = cart.items || [];

    // سلة فاضية
    if (!items.length) {
        return {
            html: `<section class="container l-wrap">${emptyBox(t('kEmptyH'), t('kEmptyP'), shopButton())}</section>`
        };
    }

    const html = `
        <section class="container l-wrap">
            <div class="l-sheet">
                <header class="l-top">
                    <div><span class="eyebrow">${t('kEye')}</span><h1>${t('kH')}</h1></div>
                    <a class="link-line" href="${U('catalog.html')}">${t('continueShop')}</a>
                </header>
                <div class="l-rows">${items.map(cartRow).join('')}</div>
                <footer class="l-total">
                    <div><span>${t('kItems')}</span><b>${cart.count || items.length}</b></div>
                    <div><span>${t('kShip')}</span><b>${t('kShipV')}</b></div>
                    <div class="grand"><span>${t('total')}</span><b>${money(cart.total)}</b></div>
                    <a class="btn btn-primary btn-block" href="${U('checkout.html')}">${t('kGo')}${ARROW_SPAN}</a>
                    <p class="muted">${t('kMore')}</p>
                </footer>
            </div>
        </section>`;

    function bind() {
        // ننفّذ العملية، نحدّث الحالة، ونعيد رسم السلة
        async function run(action) {
            try {
                await action();
                await refreshState();
                render(true);
            } catch (e) {
                toast(e.message, true);
            }
        }

        // زر الحذف
        for (const btn of $$('[data-del]')) {
            btn.onclick = () => run(() => api('cart-remove', {}, { id: +btn.dataset.del }));
        }

        // أزرار + و -
        for (const btn of $$('[data-chg]')) {
            btn.onclick = () => {
                const box = btn.closest('[data-line]');
                const id = +box.dataset.line;
                const newQty = +box.dataset.qty + +btn.dataset.chg;

                if (newQty > +box.dataset.stock) {
                    toast(t('sold'), true);
                    return;
                }

                if (newQty > 0) {
                    run(() => api('cart-update', {}, { id: id, qty: newQty }));
                } else {
                    run(() => api('cart-remove', {}, { id: id }));   // الكمية صارت 0 = حذف
                }
            };
        }
    }

    return { html: html, bind: bind };
}

/* ---------- إتمام الطلب ---------- */
function inputField(name, label, type, value) {
    return `<label class="field"><span>${label}</span><input name="${name}" type="${type}" required value="${esc(value)}"></label>`;
}

function textareaField(name, label, required) {
    return `<label class="field wide"><span>${label}</span><textarea name="${name}" rows="3" ${when(required, 'required')}></textarea></label>`;
}

function checkoutLine(x) {
    return `<div class="k-line">${imgTag(imageFor(x), x.name)}<span>${esc(x.name)}<small>× ${x.qty}</small></span><b>${money(x.subtotal)}</b></div>`;
}

// تحقق بسيط من بيانات التوصيل
function isCheckoutValid(data) {
    if (data.name.trim().length <= 2) return false;
    if (!/^[\d+\s()-]{7,}$/.test(data.phone.trim())) return false;
    if (!data.city.trim()) return false;
    if (data.address.trim().length <= 4) return false;
    return true;
}

async function vCheckout() {
    const cart = await api('cart');
    const items = cart.items || [];

    // سلة فاضية: نرجع للسلة
    if (!items.length) return { redirect: 'cart.html' };

    // مش مسجّل دخول: نعرض رسالة ونحفظ وين كان رايح
    if (!currentUser) {
        return { html: guestPrompt('k-wrap', t('xLoginH'), t('xLogin'), 'checkout.html') };
    }

    const html = `
        <section class="container k-wrap">
            <ol class="k-steps"><li class="done">${t('xS1')}</li><li class="now">${t('xS2')}</li><li>${t('xS3')}</li></ol>
            <div class="k-grid">
                <form class="k-form" id="k-form" novalidate>
                    <span class="eyebrow">${t('xEye')}</span>
                    <h1>${t('xH')}</h1>
                    <div class="k-fields">
                        ${inputField('name', t('xName'), 'text', currentUser.name)}
                        ${inputField('phone', t('xPhone'), 'tel', '')}
                        ${inputField('city', t('xCity'), 'text', '')}
                        ${textareaField('address', t('xAddr'), true)}
                        ${textareaField('notes', t('xNotes'), false)}
                    </div>
                    <div class="pay-method"><span>${t('xPay')}</span><b>✓ ${t('rCod')}</b></div>
                    <div class="form-msg" id="k-msg" role="alert"></div>
                    <button class="btn btn-primary btn-block" type="submit">${t('xPlace')}${ARROW_SPAN}</button>
                </form>
                <aside class="k-sum">
                    <h3>${t('xSum')}</h3>
                    ${items.map(checkoutLine).join('')}
                    <div class="k-total"><span>${t('total')}</span><b>${money(cart.total)}</b></div>
                    <a class="link-line" href="${U('cart.html')}">${t('xBack')}</a>
                </aside>
            </div>
        </section>`;

    function bind() {
        $('#k-form').onsubmit = async e => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target));
            const msg = $('#k-msg');
            const button = $('button[type=submit]', e.target);

            if (!isCheckoutValid(data)) {
                msg.textContent = t('xErr');
                return;
            }

            button.disabled = true;
            msg.textContent = '';
            try {
                const order = await api('orders-create', {}, data);
                await refreshState();
                nav('order-receipt.html?id=' + order.id);
            } catch (err) {
                msg.textContent = err.message;
                button.disabled = false;
            }
        };
    }

    return { html: html, bind: bind };
}

/* ---------- ملخص الطلب ---------- */
async function vReceipt(params) {
    if (!currentUser) {
        storeSet('kn_next', 'customer/orders.html');
        return { redirect: 'login.html' };
    }

    let order = null;
    try {
        order = (await api('order', { id: params.get('id') })).order;
    } catch (e) { }

    let body;
    if (order) {
        body = `<div class="r-ok">${ICONS.check}</div><h1>${t('rH')}</h1><p>${t('rP')}</p>${orderCard(order)}`;
    } else {
        body = emptyBox(t('rNone'), '', shopButton());
    }

    return { html: `<section class="container r-wrap">${body}</section>` };
}

/* ---------- طلباتي ---------- */
function orderListCard(o) {
    // أول 3 منتجات فقط
    const names = (o.items || []).slice(0, 3).map(i => i.product_name + ' ×' + i.quantity).join('، ');

    return `
    <a class="o-card" href="${U('order-receipt.html?id=' + o.id)}">
        <div><b>#${o.id}</b><small>${formatDate(o.created_at)}</small></div>
        <p>${esc(names)}</p>
        <div class="o-side">${statusChip(o.status)}<strong>${money(o.total)}</strong></div>
    </a>`;
}

async function vOrders() {
    if (!currentUser) {
        return { html: guestPrompt('o-wrap', t('dGuestH'), t('dGuestP'), 'customer/orders.html') };
    }

    const list = (await api('my-orders')).items || [];

    let content = `<div class="o-empty">${t('oEmpty')}</div>`;
    if (list.length) content = list.map(orderListCard).join('');

    return {
        html: `
        <section class="container o-wrap">
            <span class="eyebrow">${t('fOrders')}</span><h1>${t('oH')}</h1>
            ${content}
        </section>`
    };
}

/* ---------- تسجيل الدخول / إنشاء حساب ---------- */

// نصوص وإعدادات كل وضع (الاثنين بيستخدموا نفس الدالة vAuth)
const AUTH_MODES = {
    login: {
        action: 'login', title: 'aWelcome', subtitle: 'aWelcomeP', submit: 'aLogin',
        question: 'aNoAcc', linkPage: 'register.html', linkText: 'fReg',
        passwordMin: 1, passwordAutocomplete: 'current-password'
    },
    register: {
        action: 'register', title: 'aCreate', subtitle: 'aCreateP', submit: 'aReg',
        question: 'aHaveAcc', linkPage: 'login.html', linkText: 'signIn',
        passwordMin: 8, passwordAutocomplete: 'new-password'
    }
};

function authField(name, label, type = 'text', extra = '') {
    const showButton = when(type === 'password', `<button type="button" class="pw-t" data-pw>${t('aShow')}</button>`);
    return `
    <label class="field"><span>${label}</span>
        <div class="pw"><input name="${name}" type="${type}" required ${extra}>${showButton}</div>
    </label>`;
}

// بعد الدخول: نروح للصفحة المحفوظة، أو لوحة الأدمن، أو الكتالوج
function goAfterLogin() {
    let dest = storeGet('kn_next');
    storeSet('kn_next', '');

    if (!dest) {
        if (isAdmin()) {
            dest = 'admin/dashboard.html';
        } else {
            dest = 'catalog.html';
        }
    }

    if (dest.startsWith('admin/')) {
        location.href = U(dest);   // الأدمن صفحة منفصلة، فنحمّلها من جديد
    } else {
        nav(dest);
    }
}

async function vAuth(isRegister) {
    // مسجّل أصلاً: ما في داعي يشوف هالصفحة
    if (currentUser) return { redirect: 'catalog.html' };

    let mode = AUTH_MODES.login;
    if (isRegister) mode = AUTH_MODES.register;

    const nameField = when(isRegister, authField('name', t('xName'), 'text', 'minlength="3" autocomplete="name"'));
    const password2Field = when(isRegister, authField('password2', t('aPass2'), 'password', 'minlength="8" autocomplete="new-password"'));

    const form = `
        <form class="a-form" id="a-form" novalidate>
            <span class="eyebrow">${t('aEye')}</span>
            <h1>${t(mode.title)}</h1>
            <p class="a-sub">${t(mode.subtitle)}</p>
            ${nameField}
            ${authField('email', t('aEmail'), 'email', 'autocomplete="email"')}
            ${authField('password', t('aPass'), 'password', `minlength="${mode.passwordMin}" autocomplete="${mode.passwordAutocomplete}"`)}
            ${password2Field}
            <div class="form-msg" id="a-msg" role="alert"></div>
            <button class="btn btn-primary btn-block" type="submit">${t(mode.submit)}</button>
            <p class="a-switch">${t(mode.question)} <a href="${U(mode.linkPage)}">${t(mode.linkText)}</a></p>
        </form>`;

    let html;
    if (isRegister) {
        html = `
        <section class="container reg-wrap">
            ${checkList(['aB1', 'aB2', 'aB3'], 'reg-perks')}
            <div class="reg-card">${form}</div>
        </section>`;
    } else {
        html = `
        <section class="login-wrap">
            <div class="login-art">${imgTag(IMAGES.tatreez)}<div class="login-art-in"><h2>${t('aArtH1')}<br><em>${t('aArtH2')}</em></h2><p>${t('aArtP')}</p></div></div>
            <div class="login-panel">${form}</div>
        </section>`;
    }

    function bind() {
        // زر إظهار/إخفاء كلمة المرور
        for (const btn of $$('[data-pw]')) {
            btn.onclick = () => {
                const input = btn.previousElementSibling;
                if (input.type === 'password') {
                    input.type = 'text';
                    btn.textContent = t('aHide');
                } else {
                    input.type = 'password';
                    btn.textContent = t('aShow');
                }
            };
        }

        $('#a-form').onsubmit = async e => {
            e.preventDefault();
            const msg = $('#a-msg');
            const data = Object.fromEntries(new FormData(e.target));
            msg.textContent = '';

            if (isRegister) {
                if (data.password !== data.password2) {
                    msg.textContent = t('aMismatch');
                    return;
                }
                delete data.password2;   // السيرفر ما بحتاجها
            }

            try {
                await api(mode.action, {}, data);
                await refreshState();
                goAfterLogin();
            } catch (err) {
                msg.textContent = err.message;
            }
        };
    }

    return { html: html, bind: bind };
}

function vLogin() {
    return vAuth(false);
}
function vRegister() {
    return vAuth(true);
}

/* ---------- الملف الشخصي ---------- */

// الحروف الأولى من الاسم (أول حرفين) لعرضها بدل الصورة
function getInitials(name) {
    const words = String(name || 'K').trim().split(/\s+/);
    let letters = '';
    for (let i = 0; i < words.length && i < 2; i++) {
        letters += words[i].charAt(0);
    }
    return letters.toUpperCase();
}

// صورة بالمعرض (bust = باراميتر عشان المتصفح ما يستخدم الصورة القديمة المخزّنة)
function galleryFigure(path, date, bust = '') {
    const day = String(date || '').slice(0, 10);
    return `<figure><img src="${esc(imgSrc(path) + bust)}" alt="${t('prGalAlt')}"><figcaption>${esc(day)}</figcaption></figure>`;
}

// صورة الملف الشخصي (ونفس الدالة بتنستخدم بعد الرفع)
function profileImg(path, bust = '') {
    return `<img src="${esc(imgSrc(path) + bust)}" alt="${t('prPhotoAlt')}">`;
}

function profileDetail(labelKey, value, attrs = '') {
    return `<div><span>${t(labelKey)}</span><strong ${attrs}>${esc(value)}</strong></div>`;
}

async function vProfile() {
    if (!currentUser) return { redirect: 'login.html' };

    const results = await Promise.all([api('profile'), api('my-images')]);
    const u = results[0].user || {};
    const photos = results[1].items || [];

    // الصورة الشخصية أو الحروف الأولى
    let photoHtml = `<span>${esc(getInitials(u.name))}</span>`;
    if (u.profile_image) photoHtml = profileImg(u.profile_image);

    let galleryHtml = `<p class="profile-gallery-empty">${t('prEmpty')}</p>`;
    if (photos.length) {
        galleryHtml = photos.map(p => galleryFigure(p.image_path, p.created_at)).join('');
    }

    const accept = IMAGE_TYPES.join(',');

    const html = `
        <section class="container section profile-page">
            <div class="profile-heading"><span class="eyebrow">${t('fProfile')}</span><h1>${t('prH')}</h1><p>${t('prSub')}</p></div>
            <div class="profile-card">
                <div class="profile-photo-wrap">
                    <div class="profile-photo" id="profile-photo">${photoHtml}</div>
                    <label class="btn btn-primary profile-upload">${t('prChoose')}<input id="profile-image" type="file" accept="${accept}" hidden></label>
                    <small>${t('prHint')}</small>
                    <div class="form-msg" id="profile-msg" role="status"></div>
                </div>
                <div class="profile-details">
                    ${profileDetail('prName', u.name || '')}
                    ${profileDetail('prEmail', u.email || '', 'dir="ltr"')}
                    ${profileDetail('prPhone', u.phone || t('prNone'))}
                    ${profileDetail('prSince', String(u.created_at || '').slice(0, 10))}
                    <a class="btn btn-dark" href="${U('customer/orders.html')}">${t('fOrders')}</a>
                </div>
            </div>
            <section class="profile-gallery">
                <div class="profile-gallery-head">
                    <div><span class="eyebrow">${t('prGalEye')}</span><h2>${t('prGalH')}</h2><p>${t('prGalP')}</p></div>
                    <label class="btn btn-dark">${t('prAdd')}<input id="gallery-image" type="file" accept="${accept}" hidden></label>
                </div>
                <div class="profile-gallery-grid" id="profile-gallery-grid">${galleryHtml}</div>
                <div class="form-msg" id="gallery-msg" role="status"></div>
            </section>
        </section>`;

    function bind() {
        // رفع الصورة الشخصية
        const profileMsg = $('#profile-msg');
        bindUpload($('#profile-image'), profileMsg, 'profile-image', async result => {
            $('#profile-photo').innerHTML = profileImg(result.profile_image, '&v=' + Date.now());
            profileMsg.textContent = t('prSaved');
            await refreshState();
        });

        // رفع صورة للمعرض
        const galleryMsg = $('#gallery-msg');
        bindUpload($('#gallery-image'), galleryMsg, 'user-image-upload', result => {
            const emptyMsg = $('#profile-gallery-grid .profile-gallery-empty');
            if (emptyMsg) emptyMsg.remove();

            const figure = galleryFigure(result.item.image_path, result.item.created_at, '&v=' + Date.now());
            $('#profile-gallery-grid').insertAdjacentHTML('afterbegin', figure);
            galleryMsg.textContent = t('prGalDone');
        });
    }

    return { html: html, bind: bind };
}

/* ---------- حكايتنا ---------- */
function vStory() {
    return {
        html: `
        <section class="s-hero container">
            <span class="eyebrow">${t('sEye')}</span>
            <h1>${t('sH1')}<br><em>${t('sH2')}</em></h1>
            <p class="s-lead">${t('sLead')}</p>
        </section>
        <section class="s-cols container"><p class="dropcap">${t('sP1')}</p><p>${t('sP2')}</p></section>
        <section class="s-pillars container"><h2>${t('sPil')}</h2><div>${cards('sK')}</div></section>
        <section class="s-quote"><p>${t('sQuote')}</p></section>
        <section class="s-cta container">
            <h2>${t('sCta')}</h2>
            <div class="d-btns">
                <a class="btn btn-primary" href="${U('embroidery.html')}">${t('nEmb')}</a>
                <a class="btn btn-ghost-light" href="${U('pottery.html')}">${t('nPot')}</a>
            </div>
        </section>`
    };
}

/* ---------- التطريز ---------- */
async function vEmb() {
    const category = await productsByCategory(/تطريز|embroid/i);

    return {
        html: `
        <section class="e-hero container">
            <div class="e-copy">
                <span class="eyebrow">${t('eEye')}</span>
                <h1>${t('eH1')}<br><em>${t('eH2')}</em></h1>
                <p>${t('eLead')}</p>
                ${craftButtons(category.id)}
            </div>
            <div class="e-motif" aria-hidden="true">
                <svg viewBox="0 0 100 100"><g fill="none" stroke-linecap="round">
                    <rect x="14" y="14" width="72" height="72" stroke-dasharray="3 4"/>
                    <rect x="14" y="14" width="72" height="72" stroke-dasharray="3 4" transform="rotate(45 50 50)"/>
                    <rect x="28" y="28" width="44" height="44" stroke-dasharray="2 3.5"/>
                    <rect x="28" y="28" width="44" height="44" stroke-dasharray="2 3.5" transform="rotate(45 50 50)"/>
                    <path d="M44 44l12 12M56 44L44 56" stroke-dasharray="1.5 2.5"/>
                </g></svg>
            </div>
        </section>
        <div class="e-band" aria-hidden="true"></div>
        <section class="container section e-motifs">${sectionHead('', t('eM'))}<div class="e-cards">${cards('eM')}</div></section>
        ${shopSection('e-shop', '', t('eP'), category.items, 'crNone')}
        ${careSection('e-care', 'eC')}`
    };
}

/* ---------- الفخار ---------- */
async function vPot() {
    const category = await productsByCategory(/فخار|خزف|سيراميك|pottery|ceramic/i);

    return {
        html: `
        <section class="po-hero container">
            <div class="po-arch">${imgTag(IMAGES.ceramic)}</div>
            <div class="po-copy">
                <span class="eyebrow">${t('eEye')}</span>
                <h1>${t('pH1')}<br><em>${t('pH2')}</em></h1>
                <p>${t('pLead')}</p>
                ${craftButtons(category.id)}
            </div>
            <div class="po-wheel" aria-hidden="true"><i></i><i></i><i></i></div>
        </section>
        <section class="po-steps container section">${sectionHead('', t('pStepsH'))}<ol>${cards('pS', 'li', 4)}</ol></section>
        ${shopSection('po-shop', '', t('pPP'), category.items, 'crNone')}
        ${careSection('po-care', 'pC')}`
    };
}


/* =====================================================================
   8) الراوتر والأحداث والتشغيل
===================================================================== */

// اسم الشاشة => دالة الصفحة (كل الدوال بتاخد params حتى لو ما بتستخدمها)
const VIEWS = {
    home: vHome,
    catalog: vCatalog,
    product: vProduct,
    cart: vCart,
    checkout: vCheckout,
    receipt: vReceipt,
    myorders: vOrders,
    profile: vProfile,
    story: vStory,
    embroidery: vEmb,
    pottery: vPot,
    login: vLogin,
    register: vRegister
};

// اسم ملف الصفحة => اسم الشاشة
const ROUTES = {
    '': 'home',
    'index.html': 'home',
    'catalog.html': 'catalog',
    'product-detail.html': 'product',
    'cart.html': 'cart',
    'checkout.html': 'checkout',
    'login.html': 'login',
    'register.html': 'register',
    'order-receipt.html': 'receipt',
    'embroidery.html': 'embroidery',
    'pottery.html': 'pottery',
    'story.html': 'story',
    'customer/orders.html': 'myorders',
    'customer/profile.html': 'profile'
};

// الصفحات اللي بنبقي فيها "وين نرجع بعد الدخول" (kn_next)
const KEEP_NEXT = ['login', 'register', 'checkout', 'receipt', 'myorders', 'profile'];

// نحوّل الرابط لاسم شاشة: نقص مسار المشروع ونبحث عن الباقي بالجدول
function routeOf(url) {
    const basePath = new URL(BASE).pathname;
    const filePath = decodeURIComponent(url.pathname.slice(basePath.length)).toLowerCase();
    return ROUTES[filePath];
}

let app;               // عنصر #app
let renderToken = 0;   // رقم لكل عملية رسم (عشان نتجاهل القديمة)
let lastPath = '';     // آخر مسار انرسم

// تنقّل بدون إعادة تحميل الصفحة
function go(url) {
    history.pushState(null, '', url);
    render(true);
}
function nav(path) {
    go(new URL(U(path)));
}

// رسم الصفحة الحالية
// soft = true: تنقل داخلي (بنخلي الصفحة القديمة ظاهرة لحد ما الجديدة تجهز)
// soft = false: أول تحميل (بنعرض "جاري التحميل")
async function render(soft = false) {
    const url = new URL(location.href);
    const page = routeOf(url) || 'home';

    renderToken++;
    const myToken = renderToken;
    const pathChanged = lastPath !== '' && lastPath !== url.pathname;

    document.body.dataset.page = page;
    document.title = 'KANAAN | ' + t('ttl_' + page);

    // إذا الصفحة مش من اللي بتحتاج "ارجع بعد الدخول" نمسح المحفوظ
    if (!KEEP_NEXT.includes(page)) storeSet('kn_next', '');

    paintNav();
    $('#main-nav').classList.remove('open');
    $('#menu-toggle').setAttribute('aria-expanded', 'false');

    if (soft) {
        app.classList.add('page-changing');
    } else if (!app.innerHTML.trim()) {
        app.innerHTML = `<div class="container loading">${t('loading')}</div>`;
    }

    try {
        const view = await VIEWS[page](url.searchParams);

        // المستخدم انتقل لصفحة ثانية قبل ما تخلص هاي: نتجاهلها
        if (myToken !== renderToken) return;

        // الصفحة طلبت تحويل (مثلاً السلة فاضية)
        if (view.redirect) {
            history.replaceState(null, '', U(view.redirect));   // replace مش push عشان زر الرجوع ما يرجّع للصفحة المحوَّلة
            return render(true);
        }

        app.innerHTML = view.html;
        app.classList.remove('page-changing', 'in');
        void app.offsetWidth;   // حيلة لإعادة تشغيل أنيميشن الـ CSS
        app.classList.add('in');

        if (view.bind) view.bind();   // ربط الأزرار (bind اختيارية)
        lastPath = url.pathname;

        // السكرول
        if (url.hash) {
            requestAnimationFrame(() => {
                const target = $(url.hash);
                if (target) target.scrollIntoView({ behavior: 'smooth' });
            });
        } else if (pathChanged || !soft) {
            let behavior = 'auto';
            if (soft) behavior = 'smooth';
            window.scrollTo({ top: 0, behavior: behavior });
        }
    } catch (e) {
        if (myToken !== renderToken) return;

        app.classList.remove('page-changing');
        app.innerHTML = `
            <section class="container"><div class="notice">
                <h2>${t('errT')}</h2><p>${esc(e.message)}</p><p>${t('errP')}</p>
                <a class="btn btn-dark" href="${U('index.html')}">${t('toHome')}</a>
            </div></section>`;
        lastPath = url.pathname;
    }
}

/* ---------- معالج النقر الموحّد ----------
   مستمع واحد على الصفحة كلها بدل مستمع لكل زر (event delegation)
   closest() بتطلع للعنصر الأب الأقرب اللي بطابق الـ selector
   (مفيد لأنه النقر ممكن يكون على svg جوّا الزر مش الزر نفسه)
------------------------------------------------ */
document.addEventListener('click', e => {
    function hit(selector) {
        return e.target.closest(selector);
    }

    // زر اللغة
    if (hit('#lang-btn')) {
        if (isArabic()) {
            setLang('en');
        } else {
            setLang('ar');
        }
        return;
    }

    // زر القائمة (موبايل)
    const menuBtn = hit('#menu-toggle');
    if (menuBtn) {
        const isOpen = $('#main-nav').classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', isOpen);
        menuBtn.innerHTML = isOpen ? ICONS.close : ICONS.menu;
        return;
    }

    // زر قائمة الحساب
    const accountBtn = hit('#acct-btn');
    if (accountBtn) {
        const menu = $('#acct-menu');
        menu.hidden = !menu.hidden;
        accountBtn.setAttribute('aria-expanded', String(!menu.hidden));
        return;
    }

    // تسجيل الخروج
    if (hit('#logout')) {
        (async () => {
            try { await api('logout', {}, {}); } catch (err) { }
            await refreshState();
            nav('index.html');
        })();
        return;
    }

    // نقر برا قائمة الحساب: نسكّرها
    if (!hit('#acct')) {
        const menu = $('#acct-menu');
        if (menu) menu.hidden = true;
    }

    // زر "أضف للسلة" السريع
    const addBtn = hit('[data-add]');
    if (addBtn) {
        addToCart(addBtn.dataset.add);
        return;
    }

    // أزرار + و - بصفحة المنتج
    const stepBtn = hit('[data-step]');
    if (stepBtn) {
        const input = $('input', stepBtn.parentElement);
        const max = +input.max || 99;
        const current = parseInt(input.value, 10) || 1;
        input.value = Math.min(max, Math.max(1, current + +stepBtn.dataset.step));
        return;
    }

    // زر الطباعة (طباعة المتصفح، ومنها "حفظ كـ PDF")
    if (hit('[data-print]')) {
        window.print();
        return;
    }

    // الروابط الداخلية: بننتقل بين الصفحات بدون إعادة تحميل (SPA)
    const link = hit('a[href]');
    if (!link) return;

    // حالات بنخلي فيها المتصفح يتصرف عادي: نقر غير أيسر، Ctrl/Cmd/Shift (تبويب جديد)، target=_blank
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || link.target === '_blank') return;

    const url = new URL(link.href, location.href);

    // رابط خارجي أو صفحة مش معروفة بالراوتر: المتصفح يتعامل معه
    if (url.origin !== location.origin || !routeOf(url)) return;

    // رابط # بنفس الصفحة: خلي المتصفح يعمل scroll عادي
    if (url.hash && url.pathname === location.pathname && url.search === location.search) return;

    e.preventDefault();
    go(url);
});

// زر الرجوع/الأمام بالمتصفح
addEventListener('popstate', () => render(true));

/* ---------- التشغيل ---------- */
async function boot() {
    app = $('#app');
    applyDocumentLang();
    paintHeader();
    paintFooter();
    await refreshState();
    render();
}

boot();

})();