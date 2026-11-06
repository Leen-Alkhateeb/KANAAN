# KANAAN — متجر الحرف الفلسطينية

## التشغيل على XAMPP
1. انسخي مجلد `KANAAN` إلى `C:\\xampp\\htdocs\\KANAAN`.
2. شغّلي Apache و MySQL.
3. من phpMyAdmin استوردي `backend/database.sql` إذا كانت هذه أول مرة.
4. إذا كانت قاعدة البيانات موجودة من نسخة سابقة، شغّلي `backend/upgrade.sql` مرة واحدة لإضافة صور الحساب وسجل النشاطات.
5. افتحي المتجر: `http://localhost/KANAAN/frontend/index.html`.
6. افتحي لوحة الإدارة: `http://localhost/KANAAN/frontend/admin/dashboard.html`.

## حساب الأدمن التجريبي
- البريد: `admin@kanaan.ps`
- كلمة المرور: `Kanaan@2026`

سجّلي الدخول من صفحة `login.html` نفسها؛ إذا كان الحساب بدور `admin` سيتم توجيهك تلقائياً إلى لوحة الإدارة. غيّري كلمة المرور بعد أول دخول. لا تضيفي اختيار Admin إلى نموذج التسجيل العام حتى لا يستطيع الزوار منح أنفسهم صلاحيات الإدارة.

## صور حساب المستخدم
1. يسجّل المستخدم دخوله ويفتح قائمة الحساب ثم **الملف الشخصي**.
2. يختار صورة شخصية أو يضيف صوراً إلى معرض الصور.
3. الصيغ المدعومة JPG و PNG و WEBP، والحد الأقصى 2MB للصورة الواحدة.
4. تُحفظ ملفات الصور داخل `KANAAN/uploads/users/` باسم عشوائي، بينما تحفظ قاعدة البيانات المسار فقط.
5. يستطيع المستخدم رؤية صوره، ويستطيع الأدمن رؤيتها من لوحة الإدارة ثم **المستخدمون > صور الحساب > عرض**. مسار صور المستخدمين محمي ويتطلب جلسة مستخدم أو صلاحية أدمن.

## البنية البرمجية
- Frontend: HTML + CSS + JavaScript، مع دعم العربية والإنجليزية.
- Backend: PHP + PDO + MySQL + Sessions.
- OOP classes: `Auth`, `Cart`, `ImageUploader`, `UserProfile`, `UserGallery`, `AdminDashboard`.
- لا يوجد MVC؛ توجد نقطة API واحدة تستخدم `action` لتوجيه الطلبات، والكلاسات تتولى مسؤوليات الحسابات والسلة ورفع الصور والإحصائيات.
- `uploads/products/` لصور المنتجات، `uploads/categories/` لصور التصنيفات، `uploads/users/` لصور الحسابات.

## ما يتضمنه المشروع
- متجر ومنتجات وتصنيفات وسلة وطلبات.
- لوحة إدارة مع إحصائيات ومخطط مبيعات لآخر 6 أشهر.
- إدارة المنتجات والتصنيفات والطلبات والمستخدمين والحرفيين والصور وسجل النشاطات.
- رابط مباشر للوحة الإدارة يظهر للمستخدم الذي يملك دور Admin.
- صفحات Our Story وPottery بتصميم محسّن.

## ملاحظات
- إذا عدّلتِ بيانات MySQL، حدّثي `backend/db.php`.
- تأكدي أن مجلد `uploads` قابل للكتابة من PHP.
- قبل النشر الفعلي استخدمي HTTPS، وغيّري كلمة مرور الأدمن التجريبية.

## Existing database setup (important)
This version is designed to use your existing phpMyAdmin database named `kanaan_db`.
Do NOT import `database.sql` over your current database. Keep your existing products,
categories, users, orders and artisan data. On the first request, the OOP class
`backend/classes/SchemaCompatibility.php` adds only missing application columns and
the `user_images` / `activity_logs` tables. It does not drop or recreate any table.

Database connection defaults: host `localhost`, database `kanaan_db`, user `root`,
empty password. Change `backend/config/database.php` if your local MySQL credentials differ.

Admin login: admin@kanaan.ps / Kanaan@2026
User-uploaded images are stored as files under `uploads/users/`; only their relative
paths are stored in MySQL.
