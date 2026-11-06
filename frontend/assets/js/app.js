(() => {
'use strict';

/* =====================================================================
   KANAAN storefront — single-page app (Arabic / English)
   Sections:
     1. Config & state     5. Layout (header / footer)
     2. Translations       6. Components
     3. Utilities          7. Views
     4. API                8. Router, events, boot
===================================================================== */

/* ---------------------------------------------------------------------
   1. Config & state
--------------------------------------------------------------------- */
const BASE  = new URL('../../', document.currentScript.src).href;
const API   = BASE + 'api.php';
const VIDEO = BASE + 'assets/videos/15898195_3840_2160_30fps.mp4';
const PH    = BASE + 'assets/images/placeholder.svg';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_UPLOAD  = 2 * 1024 * 1024;

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const store = {
    get: k => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }
};

const S = {
    lang: store.get('kn_lang') === 'en' ? 'en' : 'ar',
    user: null,
    count: 0,
    cats: []
};

/* ---------------------------------------------------------------------
   2. Translations   key: [Arabic, English]
--------------------------------------------------------------------- */
const D = {
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
    pHome: ['الرئيسية', 'Home'], pShop: ['المتجر', 'Shop'],
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
    oEye: ['طلباتي', 'My orders'], oH: ['طلباتي ومشترياتي', 'Orders & purchases'],
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
    aName: ['الاسم الكامل', 'Full name'], aEmail: ['البريد الإلكتروني', 'Email address'], aPass: ['كلمة المرور', 'Password'],
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
    oPEye: ['حرفة', 'Craft'], pH1: ['فخار', 'Handmade'], pH2: ['صُنع بالأيدي', 'pottery'],
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

const t = k => D[k]?.[S.lang === 'ar' ? 0 : 1] ?? k;

/* ---------------------------------------------------------------------
   3. Utilities
--------------------------------------------------------------------- */
const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC_MAP[c]);
const U   = p => BASE + p;

const nf    = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = n => S.lang === 'ar' ? `${nf.format(+n || 0)} د.أ` : `JOD ${nf.format(+n || 0)}`;
const fdate = s => new Date(String(s).replace(' ', 'T'))
    .toLocaleDateString(S.lang === 'ar' ? 'ar-JO-u-nu-latn' : 'en-GB');

/* Images */
const IMG = {
    tatreez:  'https://handmadepalestine.com/cdn/shop/files/IMG_2816_6e10ba4f-7202-44bc-8155-63c839c2e4c3.jpg?v=1770279932&width=1200',
    coasters: 'https://handmadepalestine.com/cdn/shop/files/47FE90A0-EDAC-4508-A01A-0E929365307B.jpg?v=1754750565',
    jewelry:  'https://www.shoppalestine.org/cdn/shop/collections/jewelry.jpg?v=1679682706',
    soap:     'https://www.annadwa.org/wp-content/uploads/2025/08/azz211-1.webp',
    gift:     'https://handmadepalestine.com/cdn/shop/collections/IMG_8425_-_gift_set___tatreez_card_holder.jpg?crop=center&height=1200&v=1744626698&width=1200',
    wood:     'https://talleh.com/storage/resized/MTAwLXJhbWFsbGFoLTAyMTc2MDk1MTY2NjA5Mzc3OGRiLWRmMDktNGU1Yy1hNGRiLWZmYzYwMjA5NGVmMA%3D%3D_1000x600_95.webp',
    ceramic:  'https://cdn.shopify.com/s/files/1/0943/9798/9176/files/Untitled_1024_x_1024_px_3.webp?v=1776679255'
};

/* Fallback image per craft when a product has no uploaded image */
const IMG_RULES = [
    [/تطريز|وسادة|tatreez|embroid/i,      IMG.tatreez],
    [/فخار|خزف|إبريق|سيراميك|ceramic|pottery/i, IMG.ceramic],
    [/صابون|soap/i,                        IMG.soap],
    [/خشب|زيتون|wood|olive/i,              IMG.wood],
    [/مجوهر|حلي|jewel/i,                   IMG.jewelry],
    [/هدية|هدايا|gift/i,                   IMG.gift]
];

/* English names for category labels */
const CAT_EN = [
    [/تطريز/, 'Palestinian Embroidery'], [/فخار|خزف|سيراميك/, 'Pottery & Ceramics'], [/صابون/, 'Nabulsi Soap'],
    [/خشب/, 'Olive Wood'], [/هدايا|هدية/, 'Gifts & Accessories'], [/مجوهر|حلي/, 'Jewelry']
];

/** Uploaded files are served through the API; absolute URLs are used as-is. */
const imgSrc = path => /^(https?:|data:)/.test(path)
    ? path
    : `${API}?action=img&path=${encodeURIComponent(String(path).replace(/^\//, ''))}`;

function imageFor(p = {}) {
    if (p.image) return imgSrc(p.image);
    const text = `${p.category_name || ''} ${p.name || ''}`;
    return (IMG_RULES.find(([re]) => re.test(text)) || [, IMG.coasters])[1];
}

function catLabel(name = '') {
    if (S.lang === 'ar') return name || 'حرفة فلسطينية';
    const m = CAT_EN.find(([re]) => re.test(name));
    return m ? m[1] : (name || 'Palestinian Craft');
}

const imgTag = (src, alt = '') =>
    `<img loading="lazy" src="${esc(src)}" alt="${esc(alt)}" onerror="this.onerror=null;this.src='${PH}'">`;

/* Icons */
const icon = (path, w = 22) =>
    `<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;

const IC = {
    user:  icon('<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.6-3.6 3.4-5.6 7-5.6s6.4 2 7 5.6"/>'),
    bag:   icon('<path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>'),
    globe: icon('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8-3-2.8 15 0 18"/>', 20),
    menu:  icon('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    close: icon('<path d="M6 6l12 12M18 6L6 18"/>'),
    trash: icon('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6"/>', 18),
    plus:  icon('<path d="M12 5v14M5 12h14"/>', 16),
    minus: icon('<path d="M5 12h14"/>', 16),
    arrow: icon('<path d="M5 12h14M13 6l6 6-6 6"/>', 18),
    check: icon('<path d="M5 12l5 5 9-10"/>', 18)
};

const arrowSpan = `<span class="arr">${IC.arrow}</span>`;

/* ---------------------------------------------------------------------
   4. API & shared state
--------------------------------------------------------------------- */
async function api(action, params = {}, body) {
    const url = new URL(API);
    url.searchParams.set('action', action);
    for (const [k, v] of Object.entries(params)) {
        if (v !== '' && v != null) url.searchParams.set(k, v);
    }

    const opts = { credentials: 'same-origin' };
    if (body) {
        opts.method = 'POST';
        if (body instanceof FormData) {
            opts.body = body;                       // the browser sets the multipart header
        } else {
            opts.headers = { 'Content-Type': 'application/json' };
            opts.body = JSON.stringify(body);
        }
    }

    const res = await fetch(url, opts);
    let data;
    try { data = await res.json(); } catch { throw Error(t('errSrv')); }
    if (!res.ok) throw Error((S.lang === 'en' && data.error_en) || data.error || t('errGen'));
    return data;
}

async function refreshState() {
    const [cart, me] = await Promise.allSettled([api('cart'), api('me')]);
    S.count = cart.status === 'fulfilled' ? (cart.value.count || 0) : 0;
    S.user  = me.status === 'fulfilled' ? (me.value.user || null) : null;
    paintTools();
}

async function addToCart(id, qty = 1) {
    try {
        await api('cart-add', {}, { id: +id, qty });
        await refreshState();
        toast(t('added'));
        return true;
    } catch (e) {
        toast(e.message, true);
        return false;
    }
}

function toast(msg, bad) {
    let el = $('#toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'toast';
        el.setAttribute('role', 'status');
        document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = 'show' + (bad ? ' bad' : '');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { el.className = ''; }, 2600);
}

/** Loads the products of the first category whose name matches `re`. */
async function productsByCategory(re) {
    try {
        if (!S.cats.length) S.cats = (await api('categories')).items || [];
        const cat = S.cats.find(c => re.test(c.name));
        if (!cat) return { id: 0, items: [] };
        return { id: cat.id, items: (await api('products', { category: cat.id })).items || [] };
    } catch {
        return { id: 0, items: [] };
    }
}

/* ---------------------------------------------------------------------
   5. Layout — header & footer
--------------------------------------------------------------------- */
const NAV = [
    ['home', 'index.html', 'nHome'], ['catalog', 'catalog.html', 'nShop'], ['embroidery', 'embroidery.html', 'nEmb'],
    ['pottery', 'pottery.html', 'nPot'], ['story', 'story.html', 'nStory']
];

const brandHTML = (cls = 'brand') => `
    <a class="${cls}" href="${U('index.html')}">
        <span class="brand-mark">${t('mark')}</span>
        <span><b>KANAAN</b><small>${t('tagline')}</small></span>
    </a>`;

function paintHeader() {
    const host = $('#site-header');
    if (!host) return;
    host.innerHTML = `
        <div class="topline"><div class="container topinner"><span>${t('top1')}</span><span>${t('top2')}</span></div></div>
        <header class="site-header">
            <div class="container nav">
                <button class="tool menu-toggle" id="menu-toggle" type="button" aria-label="${t('menu')}" aria-expanded="false">${IC.menu}</button>
                ${brandHTML()}
                <nav class="main-nav" id="main-nav">
                    ${NAV.map(([key, file, label]) => `<a data-nav="${key}" href="${U(file)}">${t(label)}</a>`).join('')}
                </nav>
                <div class="nav-tools">
                    <a class="tool admin-shortcut" id="admin-shortcut" href="${U('admin/dashboard.html')}" hidden>✦ ${t('dAdmin')}</a>
                    <button class="tool lang-btn" id="lang-btn" type="button" aria-label="${t('langAria')}">${IC.globe}<span>${t('langTo')}</span></button>
                    <div class="acct" id="acct"></div>
                    <a class="tool cart-btn" id="cart-link" href="${U('cart.html')}" aria-label="${t('cartL')}">${IC.bag}<span class="tool-label">${t('cartL')}</span><i id="cart-count" hidden>0</i></a>
                </div>
            </div>
        </header>`;
    paintTools();
    paintNav();
}

/** Updates the cart badge, admin shortcut and account menu. */
function paintTools() {
    const badge = $('#cart-count');
    if (badge) { badge.textContent = S.count; badge.hidden = !S.count; }

    const adminLink = $('#admin-shortcut');
    const isAdmin = S.user?.role === 'admin';
    if (adminLink) adminLink.hidden = !isAdmin;

    const box = $('#acct');
    if (!box) return;

    if (!S.user) {
        box.innerHTML = `<a class="tool tool-login" href="${U('login.html')}" aria-label="${t('signIn')}">${IC.user}<span class="tool-label">${t('signIn')}</span></a>`;
        return;
    }

    const first = esc(String(S.user.name || t('myAcc')).split(' ')[0]);
    box.innerHTML = `
        <button class="tool tool-login" id="acct-btn" type="button" aria-haspopup="true" aria-expanded="false">${IC.user}<span class="tool-label">${first}</span></button>
        <div class="acct-menu" id="acct-menu" hidden>
            <small>${esc(S.user.name || '')}</small>
            <a href="${U('customer/profile.html')}">${t('fProfile')}</a>
            <a href="${U('customer/orders.html')}">${t('fOrders')}</a>
            ${isAdmin ? `<a href="${U('admin/dashboard.html')}">${t('dAdmin')}</a>` : ''}
            <button type="button" id="logout">${t('dOut')}</button>
        </div>`;
}

function paintNav() {
    const page = document.body.dataset.page;
    $$('#main-nav a').forEach(a => a.classList.toggle('active', a.dataset.nav === page));
}

function paintFooter() {
    const host = $('#site-footer');
    if (!host) return;
    host.innerHTML = `
        <footer class="site-footer">
            <div class="container footer-grid">
                <div>${brandHTML('brand footer-brand')}<p>${t('fAbout')}</p></div>
                <div><h4>${t('fDisc')}</h4>
                    <a href="${U('catalog.html')}">${t('fAll')}</a>
                    <a href="${U('story.html')}">${t('nStory')}</a>
                    <a href="${U('customer/orders.html')}">${t('fOrders')}</a></div>
                <div><h4>${t('fServ')}</h4>
                    <a href="${U('cart.html')}">${t('fCart')}</a>
                    <a href="${U('login.html')}">${t('signIn')}</a>
                    <a href="${U('register.html')}">${t('fReg')}</a></div>
                <div><h4>${t('fTouch')}</h4><p>${t('fTouchP')}</p><span class="footer-note">${t('madeIn')}</span></div>
            </div>
            <div class="copyright">${t('rights')}</div>
        </footer>`;
}

function setLang(lang) {
    S.lang = lang;
    store.set('kn_lang', lang);
    applyDocumentLang();
    paintHeader();
    paintFooter();
    render(true);
}

function applyDocumentLang() {
    document.documentElement.lang = S.lang;
    document.documentElement.dir  = S.lang === 'ar' ? 'rtl' : 'ltr';
}

/* ---------------------------------------------------------------------
   6. Components
--------------------------------------------------------------------- */
function pcard(p) {
    const href = U('product-detail.html?id=' + encodeURIComponent(p.id));
    const out  = Number(p.stock) < 1;
    return `
    <article class="pcard${out ? ' soldout' : ''}">
        <a class="pcard-img" href="${href}">${imgTag(imageFor(p), p.name)}${out ? `<span class="pcard-flag">${t('sold')}</span>` : ''}</a>
        <div class="pcard-body">
            <span class="pcard-cat">${esc(catLabel(p.category_name))}</span>
            <h3><a href="${href}">${esc(p.name)}</a></h3>
            <div class="pcard-foot">
                <b>${money(p.price)}</b>
                <button class="add-quick" type="button" data-add="${p.id}" ${out ? 'disabled' : ''} aria-label="${t('add')}">${IC.bag}</button>
            </div>
        </div>
    </article>`;
}

const productGrid = (items, emptyKey) =>
    `<div class="grid">${items.map(pcard).join('') || `<p class="muted">${t(emptyKey)}</p>`}</div>`;

const sec = (eye, title, link = '') => `
    <div class="sec-head"><div>${eye ? `<span class="eyebrow">${eye}</span>` : ''}<h2>${title}</h2></div>${link}</div>`;

const viewAllLink = `<a class="link-line" href="${U('catalog.html')}">${t('viewAll')}</a>`;

const empty = (title, text, btn = '') => `
    <div class="empty"><div class="empty-ic">${IC.bag}</div><h2>${title}</h2>${text ? `<p>${text}</p>` : ''}${btn}</div>`;

const stepper = (id, value, max) => `
    <div class="stepper" data-step-for="${id}">
        <button type="button" data-step="-1" aria-label="-">${IC.minus}</button>
        <input id="qty-${id}" type="number" min="1" max="${max}" value="${value}" inputmode="numeric" aria-label="${t('qty')}">
        <button type="button" data-step="1" aria-label="+">${IC.plus}</button>
    </div>`;

/** "Sign in / create account" prompt shown to guests. */
const guestPrompt = (wrapClass, title, text) => `
    <section class="container ${wrapClass}">${empty(title, text, `
        <div class="d-btns">
            <a class="btn btn-dark" href="${U('login.html')}">${t('signIn')}</a>
            <a class="btn btn-ghost" href="${U('register.html')}">${t('fReg')}</a>
        </div>`)}</section>`;

const statusChip = st => `<b class="st st-${esc(st)}">${t('st' + st)}</b>`;

function orderCard(o) {
    const lines = (o.items || []).map(i =>
        `<div class="r-line"><span>${esc(i.product_name)} × ${i.quantity}</span><b>${money(i.unit_price * i.quantity)}</b></div>`).join('');
    return `
    <div class="r-paper">
        <div class="r-meta"><span>${t('rNo')}: <b>#${esc(o.id)}</b></span><span>${t('rDate')}: <b>${fdate(o.created_at)}</b></span></div>
        <div class="r-meta"><span>${t('rStatus')}: ${statusChip(o.status)}</span><span>${t('rPay')}: <b>${t('pay' + o.payment_status)} · ${t('rCod')}</b></span></div>
        <div class="r-to"><span>${t('rTo')}</span><b>${esc(o.full_name)} · ${esc(o.phone)}</b><small>${esc(o.city)}, ${esc(o.address)}</small></div>
        ${lines}
        <div class="r-line r-total"><span>${t('total')}</span><b>${money(o.total)}</b></div>
        ${o.notes ? `<small class="muted">${t('notes')}: ${esc(o.notes)}</small>` : ''}
        <div class="r-actions"><button class="btn btn-ghost" type="button" data-print>${t('rPrint')}</button></div>
    </div>`;
}

/** Three-card block used by story / craft / care sections: keys prefix+1..3 and prefix+i+'p'. */
const cards = (prefix, tag = 'article') =>
    [1, 2, 3].map(i => `<${tag}><h3>${t(prefix + i)}</h3><p>${t(prefix + i + 'p')}</p></${tag}>`).join('');

/** Shared file upload: validates, posts to the API, then calls onDone(result). */
function bindUpload(input, msgEl, action, onDone) {
    input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        if (!IMAGE_TYPES.includes(file.type) || file.size > MAX_UPLOAD) {
            msgEl.textContent = t('prBad');
            return;
        }
        const fd = new FormData();
        fd.append('image', file);
        msgEl.textContent = t('prUp');
        try {
            await onDone(await api(action, {}, fd));
            input.value = '';
        } catch (e) {
            msgEl.textContent = e.message;
        }
    };
}

/* ---------------------------------------------------------------------
   7. Views — each returns { html, bind?, redirect? }
--------------------------------------------------------------------- */
async function vHome() {
    const [cats, prods] = await Promise.all([api('categories'), api('products')]);
    S.cats = cats.items || [];

    const collections = S.cats.slice(0, 3).map(c => `
        <a class="h-cat" href="${U('catalog.html?category=' + c.id)}">
            ${imgTag(imageFor({ name: c.name, image: c.image }), c.name)}
            <span><b>${esc(catLabel(c.name))}</b><i>${t('explore')}</i></span>
        </a>`).join('');

    return {
        html: `
        <section class="h-hero">
            <video class="h-video" src="${VIDEO}" poster="${IMG.tatreez}" autoplay muted loop playsinline preload="metadata"></video>
            <div class="h-shade"></div>
            <div class="container h-inner">
                <span class="eyebrow">${t('hEye')}</span>
                <h1>${t('hH1')}<br><em>${t('hH2')}</em></h1>
                <p>${t('hP')}</p>
                <div class="h-actions">
                    <a class="btn btn-primary" href="${U('catalog.html')}">${t('hCta')}${arrowSpan}</a>
                    <a class="btn btn-ghost-light" href="${U('story.html')}">${t('hStory')}</a>
                </div>
            </div>
            <div class="h-stamp">${t('hStamp')}</div>
        </section>
        <section class="container h-strip"><span>${t('hS1')}</span><span>${t('hS2')}</span><span>${t('hS3')}</span></section>
        <section class="container section">
            ${sec(t('hColEye'), t('hCol'), viewAllLink)}
            <div class="h-cats">${collections}</div>
        </section>
        <section class="h-products"><div class="container section">
            ${sec(t('hPickEye'), t('hPick'), viewAllLink)}
            ${productGrid((prods.items || []).slice(0, 8), 'hNone')}
        </div></section>
        <section class="h-story">
            <div class="h-story-img">${imgTag(IMG.gift)}</div>
            <div class="h-story-copy">
                <span class="eyebrow">${t('hStEye')}</span>
                <h2>${t('hStH')}<br><em>${t('hStH2')}</em></h2>
                <p>${t('hStP')}</p>
                <a class="btn btn-dark" href="${U('story.html')}">${t('hStory')}${arrowSpan}</a>
                <div class="h-sign">${t('hStSign')}</div>
            </div>
        </section>
        <section class="h-quote"><p>${t('hQuote')}</p><small>KANAAN</small></section>`,
        bind() {
            const video = $('.h-video');
            if (video && matchMedia('(prefers-reduced-motion: reduce)').matches) video.pause();
        }
    };
}

async function vCatalog(q) {
    const f = { category: q.get('category') || '', q: q.get('q') || '', sort: q.get('sort') || 'new' };

    const [cats, prods] = await Promise.all([
        api('categories'),
        api('products', { q: f.q, category: f.category })
    ]);
    S.cats = cats.items || [];
    let items = prods.items || [];

    const sorted = () => {
        const list = [...items];
        if (f.sort === 'low')  list.sort((a, b) => a.price - b.price);
        if (f.sort === 'high') list.sort((a, b) => b.price - a.price);
        return list;
    };

    /** Catalog URL for the current filters, optionally overridden. */
    const urlFor = (next = {}) => {
        const params = new URLSearchParams();
        Object.entries({ ...f, ...next }).forEach(([k, v]) => {
            if (v && !(k === 'sort' && v === 'new')) params.set(k, v);
        });
        const qs = params.toString();
        return U('catalog.html') + (qs ? '?' + qs : '');
    };

    const gridHTML = () => sorted().map(pcard).join('') || `<p class="empty-line">${t('cNone')}</p>`;
    const sortOption = (value, key) => `<option value="${value}" ${f.sort === value ? 'selected' : ''}>${t(key)}</option>`;
    const chip = (id, label) =>
        `<a class="chip ${String(f.category) === String(id) ? 'active' : ''}" data-category="${esc(id)}" href="${urlFor({ category: id })}">${label}</a>`;

    return {
        html: `
        <section class="c-head container">
            <span class="eyebrow">${t('cEye')}</span>
            <h1>${t('cH')}</h1>
            <p class="c-count" id="catalog-count">${items.length} ${t('cCount')}</p>
        </section>
        <section class="container c-tools">
            <form class="c-search" id="c-search">
                <input name="q" type="search" value="${esc(f.q)}" placeholder="${t('cSearch')}" aria-label="${t('cGo')}">
                <button class="btn btn-dark" type="submit">${t('cGo')}</button>
            </form>
            <select id="c-sort" aria-label="sort">
                ${sortOption('new', 'sNew')}${sortOption('low', 'sLow')}${sortOption('high', 'sHigh')}
            </select>
        </section>
        <nav class="container chips" id="catalog-chips" aria-label="categories">
            ${chip('', t('cAll'))}
            ${S.cats.map(c => chip(c.id, esc(catLabel(c.name)))).join('')}
        </nav>
        <section class="container c-grid-wrap">
            <div class="grid grid-3 catalog-products" id="catalog-products">${gridHTML()}</div>
        </section>`,

        bind() {
            const form  = $('#c-search');
            const input = $('input[name="q"]', form);
            const select = $('#c-sort');
            const chips = $('#catalog-chips');
            const grid  = $('#catalog-products');
            const count = $('#catalog-count');
            let requestId = 0;

            const syncAddress = () => history.replaceState(history.state, '', urlFor());

            const paintGrid = () => {
                grid.innerHTML = gridHTML();
                grid.classList.remove('is-filtering', 'filter-updated');
                void grid.offsetWidth;                       // restart the CSS animation
                grid.classList.add('filter-updated');
                count.textContent = `${items.length} ${t('cCount')}`;
            };

            const paintChips = () => $$('[data-category]', chips).forEach(a => {
                const active = String(a.dataset.category) === String(f.category);
                a.classList.toggle('active', active);
                active ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
            });

            const reload = async changes => {
                Object.assign(f, changes);
                input.value = f.q;
                select.value = f.sort;
                paintChips();
                syncAddress();

                const current = ++requestId;
                grid.classList.add('is-filtering');
                try {
                    const res = await api('products', { q: f.q, category: f.category });
                    if (current !== requestId) return;
                    items = res.items || [];
                    paintGrid();
                } catch (err) {
                    if (current !== requestId) return;
                    grid.classList.remove('is-filtering');
                    grid.innerHTML = `<p class="empty-line">${esc(err.message || t('errGen'))}</p>`;
                    count.textContent = `0 ${t('cCount')}`;
                }
            };

            form.addEventListener('submit', e => {
                e.preventDefault();
                reload({ q: input.value.trim() });
            });

            select.addEventListener('change', () => {
                f.sort = select.value;
                syncAddress();
                paintGrid();                                 // sorting is client-side
            });

            chips.addEventListener('click', e => {
                const link = e.target.closest('a[data-category]');
                if (!link) return;
                e.preventDefault();
                reload({ category: link.dataset.category });
            });
        }
    };
}

async function vProduct(q) {
    const { item: p } = await api('product', { id: q.get('id') });

    let related = [];
    try {
        related = ((await api('products', { category: p.category_id })).items || [])
            .filter(x => x.id != p.id)
            .slice(0, 4);
    } catch {}

    const out = Number(p.stock) < 1;
    const max = Math.max(1, Number(p.stock) || 1);

    const artisan = p.artisan_name ? `
        <div class="p-artisan">
            <span class="eyebrow">${t('pArt')}</span><b>${esc(p.artisan_name)}</b>
            ${p.artisan_story ? `<p>${esc(p.artisan_story)}</p>` : ''}
        </div>` : '';

    return {
        html: `
        <section class="container p-wrap">
            <div class="p-gallery"><div class="p-frame">${imgTag(imageFor(p), p.name)}</div></div>
            <div class="p-info">
                <nav class="crumbs"><a href="${U('index.html')}">${t('pHome')}</a> / <a href="${U('catalog.html')}">${t('pShop')}</a> / ${esc(p.name)}</nav>
                <span class="eyebrow">${esc(catLabel(p.category_name))}</span>
                <h1>${esc(p.name)}</h1>
                <div class="p-price">${money(p.price)}</div>
                <p class="p-desc">${esc(p.description || t('pDescDef'))}</p>
                <ul class="p-facts">${['pF1', 'pF2', 'pF3'].map(k => `<li>${IC.check}${t(k)}</li>`).join('')}</ul>
                ${artisan}
                <div class="p-buy">
                    ${stepper(p.id, 1, max)}
                    <button class="btn btn-primary" id="p-add" type="button" ${out ? 'disabled' : ''}>${out ? t('sold') : t('add')}</button>
                    <button class="btn btn-ghost" id="p-now" type="button" ${out ? 'disabled' : ''}>${t('pBuy')}</button>
                </div>
                <small class="muted">${t('pStock')}: ${esc(p.stock ?? '—')}</small>
            </div>
        </section>
        ${related.length ? `<section class="container section p-rel">${sec('', t('pRel'))}<div class="grid">${related.map(pcard).join('')}</div></section>` : ''}`,

        bind() {
            const qty = () => Math.min(max, Math.max(1, parseInt($(`#qty-${p.id}`).value, 10) || 1));
            $('#p-add').onclick = () => addToCart(p.id, qty());
            $('#p-now').onclick = async () => { if (await addToCart(p.id, qty())) nav('checkout.html'); };
        }
    };
}

async function vCart() {
    const cart = await api('cart');
    const items = cart.items || [];

    if (!items.length) {
        return {
            html: `<section class="container l-wrap">${empty(t('kEmptyH'), t('kEmptyP'),
                `<a class="btn btn-dark" href="${U('catalog.html')}">${t('continueShop')}</a>`)}</section>`
        };
    }

    const row = x => {
        const href = U('product-detail.html?id=' + x.id);
        return `
        <div class="l-row">
            <a class="l-thumb" href="${href}">${imgTag(imageFor(x), x.name)}</a>
            <div class="l-name"><a href="${href}">${esc(x.name)}</a><small>${money(x.price)} ${t('kEach')}</small></div>
            <div class="stepper sm" data-line="${x.id}" data-stock="${x.stock}" data-qty="${x.qty}">
                <button type="button" data-chg="-1" aria-label="-">${IC.minus}</button><span>${x.qty}</span><button type="button" data-chg="1" aria-label="+">${IC.plus}</button>
            </div>
            <span class="l-dots"></span>
            <b class="l-sub">${money(x.subtotal)}</b>
            <button class="l-del" type="button" data-del="${x.id}" aria-label="${t('remove')}">${IC.trash}</button>
        </div>`;
    };

    return {
        html: `
        <section class="container l-wrap">
            <div class="l-sheet">
                <header class="l-top">
                    <div><span class="eyebrow">${t('kEye')}</span><h1>${t('kH')}</h1></div>
                    <a class="link-line" href="${U('catalog.html')}">${t('continueShop')}</a>
                </header>
                <div class="l-rows">${items.map(row).join('')}</div>
                <footer class="l-total">
                    <div><span>${t('kItems')}</span><b>${cart.count || items.length}</b></div>
                    <div><span>${t('kShip')}</span><b>${t('kShipV')}</b></div>
                    <div class="grand"><span>${t('total')}</span><b>${money(cart.total)}</b></div>
                    <a class="btn btn-primary btn-block" href="${U('checkout.html')}">${t('kGo')}${arrowSpan}</a>
                    <p class="muted">${t('kMore')}</p>
                </footer>
            </div>
        </section>`,

        bind() {
            const run = async fn => {
                try { await fn(); await refreshState(); render(true); }
                catch (e) { toast(e.message, true); }
            };

            $$('[data-del]').forEach(btn => btn.onclick = () =>
                run(() => api('cart-remove', {}, { id: +btn.dataset.del })));

            $$('[data-chg]').forEach(btn => btn.onclick = () => {
                const box  = btn.closest('[data-line]');
                const id   = +box.dataset.line;
                const next = +box.dataset.qty + +btn.dataset.chg;
                if (next > +box.dataset.stock) return toast(t('sold'), true);
                run(() => next > 0
                    ? api('cart-update', {}, { id, qty: next })
                    : api('cart-remove', {}, { id }));
            });
        }
    };
}

async function vCheckout() {
    const cart = await api('cart');
    const items = cart.items || [];
    if (!items.length) return { redirect: 'cart.html' };

    if (!S.user) {
        store.set('kn_next', 'checkout.html');
        return { html: guestPrompt('k-wrap', t('xLoginH'), t('xLogin')) };
    }

    const field = (name, label, { wide, area, type, value = '' } = {}) => `
        <label class="field ${wide ? 'wide' : ''}"><span>${label}</span>${area
            ? `<textarea name="${name}" rows="3" ${name !== 'notes' ? 'required' : ''}></textarea>`
            : `<input name="${name}" ${type ? `type="${type}"` : ''} required value="${esc(value)}">`}</label>`;

    const summaryLine = x => `
        <div class="k-line">${imgTag(imageFor(x), x.name)}<span>${esc(x.name)}<small>× ${x.qty}</small></span><b>${money(x.subtotal)}</b></div>`;

    return {
        html: `
        <section class="container k-wrap">
            <ol class="k-steps"><li class="done">${t('xS1')}</li><li class="now">${t('xS2')}</li><li>${t('xS3')}</li></ol>
            <div class="k-grid">
                <form class="k-form" id="k-form" novalidate>
                    <span class="eyebrow">${t('xEye')}</span>
                    <h1>${t('xH')}</h1>
                    <div class="k-fields">
                        ${field('name', t('xName'), { value: S.user.name })}
                        ${field('phone', t('xPhone'), { type: 'tel' })}
                        ${field('city', t('xCity'))}
                        ${field('address', t('xAddr'), { area: true, wide: true })}
                        ${field('notes', t('xNotes'), { area: true, wide: true })}
                    </div>
                    <div class="pay-method"><span>${t('xPay')}</span><b>✓ ${t('rCod')}</b></div>
                    <div class="form-msg" id="k-msg" role="alert"></div>
                    <button class="btn btn-primary btn-block" type="submit">${t('xPlace')}${arrowSpan}</button>
                </form>
                <aside class="k-sum">
                    <h3>${t('xSum')}</h3>
                    ${items.map(summaryLine).join('')}
                    <div class="k-total"><span>${t('total')}</span><b>${money(cart.total)}</b></div>
                    <a class="link-line" href="${U('cart.html')}">${t('xBack')}</a>
                </aside>
            </div>
        </section>`,

        bind() {
            $('#k-form').onsubmit = async e => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.target));
                const msg = $('#k-msg');
                const btn = $('button[type=submit]', e.target);

                const valid = data.name.trim().length > 2
                    && /^[\d+\s()-]{7,}$/.test(data.phone.trim())
                    && data.city.trim()
                    && data.address.trim().length > 4;
                if (!valid) { msg.textContent = t('xErr'); return; }

                btn.disabled = true;
                msg.textContent = '';
                try {
                    const order = await api('orders-create', {}, data);
                    await refreshState();
                    nav('order-receipt.html?id=' + order.id);
                } catch (err) {
                    msg.textContent = err.message;
                    btn.disabled = false;
                }
            };
        }
    };
}

async function vReceipt(q) {
    if (!S.user) {
        store.set('kn_next', 'customer/orders.html');
        return { redirect: 'login.html' };
    }
    let order = null;
    try { order = (await api('order', { id: q.get('id') })).order; } catch {}

    const body = order
        ? `<div class="r-ok">${IC.check}</div><h1>${t('rH')}</h1><p>${t('rP')}</p>${orderCard(order)}`
        : empty(t('rNone'), '', `<a class="btn btn-dark" href="${U('catalog.html')}">${t('continueShop')}</a>`);
    return { html: `<section class="container r-wrap">${body}</section>` };
}

async function vOrders() {
    if (!S.user) {
        store.set('kn_next', 'customer/orders.html');
        return { html: guestPrompt('o-wrap', t('dGuestH'), t('dGuestP')) };
    }

    const list = (await api('my-orders')).items || [];
    const card = o => `
        <a class="o-card" href="${U('order-receipt.html?id=' + o.id)}">
            <div><b>#${o.id}</b><small>${fdate(o.created_at)}</small></div>
            <p>${esc((o.items || []).slice(0, 3).map(i => `${i.product_name} ×${i.quantity}`).join('، '))}</p>
            <div class="o-side">${statusChip(o.status)}<strong>${money(o.total)}</strong></div>
        </a>`;

    return {
        html: `
        <section class="container o-wrap">
            <span class="eyebrow">${t('oEye')}</span><h1>${t('oH')}</h1>
            ${list.length ? list.map(card).join('') : `<div class="o-empty">${t('oEmpty')}</div>`}
        </section>`
    };
}

async function vAuth(isRegister) {
    if (S.user) return { redirect: 'catalog.html' };

    const field = (name, label, type = 'text', extra = '') => `
        <label class="field"><span>${label}</span>
            <div class="pw"><input name="${name}" type="${type}" required ${extra}>
            ${type === 'password' ? `<button type="button" class="pw-t" data-pw>${t('aShow')}</button>` : ''}</div>
        </label>`;

    const form = `
        <form class="a-form" id="a-form" novalidate>
            <span class="eyebrow">${t('aEye')}</span>
            <h1>${isRegister ? t('aCreate') : t('aWelcome')}</h1>
            <p class="a-sub">${isRegister ? t('aCreateP') : t('aWelcomeP')}</p>
            ${isRegister ? field('name', t('aName'), 'text', 'minlength="3" autocomplete="name"') : ''}
            ${field('email', t('aEmail'), 'email', 'autocomplete="email"')}
            ${field('password', t('aPass'), 'password', `minlength="${isRegister ? 8 : 1}" autocomplete="${isRegister ? 'new-password' : 'current-password'}"`)}
            ${isRegister ? field('password2', t('aPass2'), 'password', 'minlength="8" autocomplete="new-password"') : ''}
            <div class="form-msg" id="a-msg" role="alert"></div>
            <button class="btn btn-primary btn-block" type="submit">${isRegister ? t('aReg') : t('aLogin')}</button>
            <p class="a-switch">${isRegister ? t('aHaveAcc') : t('aNoAcc')} <a href="${U(isRegister ? 'login.html' : 'register.html')}">${isRegister ? t('signIn') : t('fReg')}</a></p>
        </form>`;

    const html = isRegister
        ? `<section class="container reg-wrap">
              <ul class="reg-perks">${['aB1', 'aB2', 'aB3'].map(k => `<li>${IC.check}${t(k)}</li>`).join('')}</ul>
              <div class="reg-card">${form}</div>
           </section>`
        : `<section class="login-wrap">
              <div class="login-art">${imgTag(IMG.tatreez)}<div class="login-art-in"><h2>${t('aArtH1')}<br><em>${t('aArtH2')}</em></h2><p>${t('aArtP')}</p></div></div>
              <div class="login-panel">${form}</div>
           </section>`;

    return {
        html,
        bind() {
            $$('[data-pw]').forEach(btn => btn.onclick = () => {
                const input = btn.previousElementSibling;
                const show = input.type === 'password';
                input.type = show ? 'text' : 'password';
                btn.textContent = show ? t('aHide') : t('aShow');
            });

            $('#a-form').onsubmit = async e => {
                e.preventDefault();
                const msg = $('#a-msg');
                const data = Object.fromEntries(new FormData(e.target));
                msg.textContent = '';

                if (isRegister && data.password !== data.password2) { msg.textContent = t('aMismatch'); return; }
                delete data.password2;

                try {
                    await api(isRegister ? 'register' : 'login', {}, data);
                    await refreshState();

                    const next = store.get('kn_next');
                    store.set('kn_next', '');
                    const dest = next || (S.user?.role === 'admin' ? 'admin/dashboard.html' : 'catalog.html');
                    dest.startsWith('admin/') ? (location.href = U(dest)) : nav(dest);   // admin is a separate app
                } catch (err) {
                    msg.textContent = err.message;
                }
            };
        }
    };
}

async function vProfile() {
    if (!S.user) return { redirect: 'login.html' };

    const [{ user: u = {} }, gallery] = await Promise.all([api('profile'), api('my-images')]);
    const photos = gallery.items || [];
    const initials = esc((u.name || 'K').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase());

    const figure = (path, date, bust = '') =>
        `<figure><img src="${esc(imgSrc(path) + bust)}" alt="${t('prGalAlt')}"><figcaption>${esc(String(date || '').slice(0, 10))}</figcaption></figure>`;
    const detail = (label, value, attrs = '') => `<div><span>${t(label)}</span><strong ${attrs}>${esc(value)}</strong></div>`;

    return {
        html: `
        <section class="container section profile-page">
            <div class="profile-heading"><span class="eyebrow">${t('fProfile')}</span><h1>${t('prH')}</h1><p>${t('prSub')}</p></div>
            <div class="profile-card">
                <div class="profile-photo-wrap">
                    <div class="profile-photo" id="profile-photo">${u.profile_image ? `<img src="${esc(imgSrc(u.profile_image))}" alt="${t('prPhotoAlt')}">` : `<span>${initials}</span>`}</div>
                    <label class="btn btn-primary profile-upload">${t('prChoose')}<input id="profile-image" type="file" accept="${IMAGE_TYPES.join(',')}" hidden></label>
                    <small>${t('prHint')}</small>
                    <div class="form-msg" id="profile-msg" role="status"></div>
                </div>
                <div class="profile-details">
                    ${detail('prName', u.name || '')}
                    ${detail('prEmail', u.email || '', 'dir="ltr"')}
                    ${detail('prPhone', u.phone || t('prNone'))}
                    ${detail('prSince', String(u.created_at || '').slice(0, 10))}
                    <a class="btn btn-dark" href="${U('customer/orders.html')}">${t('fOrders')}</a>
                </div>
            </div>
            <section class="profile-gallery">
                <div class="profile-gallery-head">
                    <div><span class="eyebrow">${t('prGalEye')}</span><h2>${t('prGalH')}</h2><p>${t('prGalP')}</p></div>
                    <label class="btn btn-dark">${t('prAdd')}<input id="gallery-image" type="file" accept="${IMAGE_TYPES.join(',')}" hidden></label>
                </div>
                <div class="profile-gallery-grid" id="profile-gallery-grid">
                    ${photos.map(p => figure(p.image_path, p.created_at)).join('') || `<p class="profile-gallery-empty">${t('prEmpty')}</p>`}
                </div>
                <div class="form-msg" id="gallery-msg" role="status"></div>
            </section>
        </section>`,

        bind() {
            const profileMsg = $('#profile-msg');
            bindUpload($('#profile-image'), profileMsg, 'profile-image', async res => {
                $('#profile-photo').innerHTML =
                    `<img src="${esc(imgSrc(res.profile_image) + '&v=' + Date.now())}" alt="${t('prPhotoAlt')}">`;
                profileMsg.textContent = t('prSaved');
                await refreshState();
            });

            const galleryMsg = $('#gallery-msg');
            bindUpload($('#gallery-image'), galleryMsg, 'user-image-upload', res => {
                $('#profile-gallery-grid .profile-gallery-empty')?.remove();
                $('#profile-gallery-grid').insertAdjacentHTML('afterbegin',
                    figure(res.item.image_path, res.item.created_at, '&v=' + Date.now()));
                galleryMsg.textContent = t('prGalDone');
            });
        }
    };
}

async function vStory() {
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

/** Two buttons shared by the craft pages: shop this category / shop everything. */
const craftButtons = categoryId => `
    <div class="d-btns">
        <a class="btn btn-primary" href="${U('catalog.html' + (categoryId ? '?category=' + categoryId : ''))}">${t('crShop')}</a>
        <a class="btn btn-ghost" href="${U('catalog.html')}">${t('crAll')}</a>
    </div>`;

async function vEmb() {
    const { id, items } = await productsByCategory(/تطريز|embroid/i);
    return {
        html: `
        <section class="e-hero container">
            <div class="e-copy">
                <span class="eyebrow">${t('eEye')}</span>
                <h1>${t('eH1')}<br><em>${t('eH2')}</em></h1>
                <p>${t('eLead')}</p>
                ${craftButtons(id)}
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
        <section class="container section e-motifs">${sec('', t('eM'))}<div class="e-cards">${cards('eM')}</div></section>
        <section class="e-shop"><div class="container section">${sec('', t('eP'))}${productGrid(items, 'crNone')}</div></section>
        <section class="e-care container section">${sec('', t('crCare'))}<div class="care">${cards('eC')}</div></section>`
    };
}

async function vPot() {
    const { id, items } = await productsByCategory(/فخار|خزف|سيراميك|pottery|ceramic/i);
    const steps = [1, 2, 3, 4].map(i => `<li><h3>${t('pS' + i)}</h3><p>${t('pS' + i + 'p')}</p></li>`).join('');
    return {
        html: `
        <section class="po-hero container">
            <div class="po-arch">${imgTag(IMG.ceramic)}</div>
            <div class="po-copy">
                <span class="eyebrow">${t('oPEye')}</span>
                <h1>${t('pH1')}<br><em>${t('pH2')}</em></h1>
                <p>${t('pLead')}</p>
                ${craftButtons(id)}
            </div>
            <div class="po-wheel" aria-hidden="true"><i></i><i></i><i></i></div>
        </section>
        <section class="po-steps container section">${sec('', t('pStepsH'))}<ol>${steps}</ol></section>
        <section class="po-shop"><div class="container section">${sec('', t('pPP'))}${productGrid(items, 'crNone')}</div></section>
        <section class="po-care container section">${sec('', t('crCare'))}<div class="care">${cards('pC')}</div></section>`
    };
}

/* ---------------------------------------------------------------------
   8. Router, events & boot
--------------------------------------------------------------------- */
const VIEWS = {
    home: vHome, catalog: vCatalog, product: vProduct, cart: vCart, checkout: vCheckout,
    receipt: vReceipt, myorders: vOrders, profile: vProfile, story: vStory,
    embroidery: vEmb, pottery: vPot,
    login: () => vAuth(false), register: () => vAuth(true)
};

const ROUTES = {
    '': 'home', 'index.html': 'home', 'catalog.html': 'catalog', 'product-detail.html': 'product',
    'cart.html': 'cart', 'checkout.html': 'checkout', 'login.html': 'login', 'register.html': 'register',
    'order-receipt.html': 'receipt', 'embroidery.html': 'embroidery', 'pottery.html': 'pottery',
    'story.html': 'story', 'customer/orders.html': 'myorders', 'customer/profile.html': 'profile'
};

/** Pages that keep the "go here after login" target alive. */
const KEEP_NEXT = ['login', 'register', 'checkout', 'receipt', 'myorders', 'profile'];

const routeOf = url =>
    ROUTES[decodeURIComponent(url.pathname.slice(new URL(BASE).pathname.length)).toLowerCase()];

let app;
let renderToken = 0;
let lastPath = '';

function go(url) {
    history.pushState(null, '', url);
    render(true);
}
const nav = path => go(new URL(U(path)));

async function render(soft = false) {
    const url  = new URL(location.href);
    const page = routeOf(url) || 'home';
    const mine = ++renderToken;
    const pathChanged = !!lastPath && lastPath !== url.pathname;

    document.body.dataset.page = page;
    document.title = 'KANAAN | ' + t('ttl_' + page);
    if (!KEEP_NEXT.includes(page)) store.set('kn_next', '');
    paintNav();
    $('#main-nav')?.classList.remove('open');
    $('#menu-toggle')?.setAttribute('aria-expanded', 'false');

    // Keep the current page visible while the next one is prepared.
    if (soft) app.classList.add('page-changing');
    else if (!app.innerHTML.trim()) app.innerHTML = `<div class="container loading">${t('loading')}</div>`;

    try {
        const view = await VIEWS[page](url.searchParams);
        if (mine !== renderToken) return;                // a newer navigation took over

        if (view.redirect) {
            history.replaceState(null, '', U(view.redirect));
            return render(true);
        }

        app.innerHTML = view.html;
        app.classList.remove('page-changing', 'in');
        void app.offsetWidth;                            // restart the CSS animation
        app.classList.add('in');
        view.bind?.();
        lastPath = url.pathname;

        if (url.hash) requestAnimationFrame(() => $(url.hash)?.scrollIntoView({ behavior: 'smooth' }));
        else if (pathChanged || !soft) window.scrollTo({ top: 0, behavior: soft ? 'smooth' : 'auto' });
    } catch (e) {
        if (mine !== renderToken) return;
        app.classList.remove('page-changing');
        app.innerHTML = `
            <section class="container"><div class="notice">
                <h2>${t('errT')}</h2><p>${esc(e.message)}</p><p>${t('errP')}</p>
                <a class="btn btn-dark" href="${U('index.html')}">${t('toHome')}</a>
            </div></section>`;
        lastPath = url.pathname;
    }
}

/* One delegated click handler for the whole app */
document.addEventListener('click', e => {
    const hit = sel => e.target.closest(sel);

    if (hit('#lang-btn')) return setLang(S.lang === 'ar' ? 'en' : 'ar');

    const menuBtn = hit('#menu-toggle');
    if (menuBtn) {
        const open = $('#main-nav').classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', open);
        menuBtn.innerHTML = open ? IC.close : IC.menu;
        return;
    }

    const acctBtn = hit('#acct-btn');
    if (acctBtn) {
        const menu = $('#acct-menu');
        menu.hidden = !menu.hidden;
        acctBtn.setAttribute('aria-expanded', String(!menu.hidden));
        return;
    }

    if (hit('#logout')) {
        (async () => {
            try { await api('logout', {}, {}); } catch {}
            await refreshState();
            nav('index.html');
        })();
        return;
    }

    if (!hit('#acct')) { const menu = $('#acct-menu'); if (menu) menu.hidden = true; }

    const addBtn = hit('[data-add]');
    if (addBtn) return addToCart(addBtn.dataset.add);

    const stepBtn = hit('[data-step]');
    if (stepBtn) {
        const input = $('input', stepBtn.parentElement);
        const max = +input.max || 99;
        input.value = Math.min(max, Math.max(1, (parseInt(input.value, 10) || 1) + +stepBtn.dataset.step));
        return;
    }

    if (hit('[data-print]')) return window.print();

    // Internal links navigate without reloading the page.
    const link = hit('a[href]');
    if (!link || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || link.target === '_blank') return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !routeOf(url)) return;
    if (url.hash && url.pathname === location.pathname && url.search === location.search) return;
    e.preventDefault();
    go(url);
});

addEventListener('popstate', () => render(true));

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