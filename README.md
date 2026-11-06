# KANAAN

**A bilingual (Arabic / English) e-commerce platform for handmade crafts, with a full admin dashboard.**
Built with plain **PHP (OOP) + MySQL** on the backend and a **vanilla JavaScript** front end. No frameworks, no build step.

![PHP](https://img.shields.io/badge/PHP-8%2B-777BB4?logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-InnoDB-4479A1?logo=mysql&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?logo=javascript&logoColor=black)
![RTL](https://img.shields.io/badge/RTL-supported-34442c)

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Creating the first admin](#creating-the-first-admin)
- [API reference](#api-reference)
- [Database](#database)
- [Security](#security)
- [Production checklist](#production-checklist)
- [نبذة بالعربي](#نبذة-بالعربي)

---

## Features

### Storefront
- Product catalog with **search** and **category filter**
- Product pages with the **artisan's name and story**
- **Session-based cart** with live stock checks (quantity never exceeds stock)
- Checkout with order history per customer
- Customer profile: change password, profile photo, private photo gallery
- **Arabic / English** switch with automatic **RTL / LTR** layout

### Admin dashboard (single-page app, no page reloads)
- Overview: totals, pending orders, revenue, **6-month sales chart**, latest orders, **low-stock alerts**
- Products: add / edit / delete, image upload with live preview, instant search
- Categories: add / edit / delete (blocked while the category still has products)
- Orders: filter by status, view details, update order and payment status
  - Cancelling an order **returns the stock automatically**; a cancelled order can't be reopened
- Users: change roles, delete users (blocked if they have orders), view their uploaded photos
- Artisans overview, quick product-image manager, and a full **activity log**
- Custom delete-confirmation popup for products, categories and users

---

## Tech stack

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Backend    | PHP 8+ (OOP, PDO), JSON API                             |
| Database   | MySQL / MariaDB (InnoDB, utf8mb4)                       |
| Front end  | HTML, CSS (logical properties for RTL/LTR), vanilla JS  |
| Server     | Apache (XAMPP / WAMP / LAMP) with `.htaccess`           |

---

## Project structure

```text
kanaan/
├── backend/                  # not reachable directly from the browser (.htaccess)
│   ├── api/
│   │   └── index.php         # JSON API: every `?action=...` lives here
│   ├── classes/
│   │   ├── Auth.php          # login, register, roles, logout
│   │   ├── Cart.php          # session cart
│   │   ├── ImageUploader.php # safe image uploads
│   │   ├── UserProfile.php   # profile data + profile image
│   │   ├── UserGallery.php   # private user photo gallery
│   │   └── AdminDashboard.php# dashboard statistics
│   ├── db.php                # PDO singleton
│   ├── helpers.php           # e(), url(), csrf, flash, status lists
│   ├── init.php              # constants, secure session, autoload of classes
│   └── create_admin.php      # CLI script to create the first admin
├── frontend/
│   ├── api.php               # bridge: exposes the backend API to the browser
│   ├── index.html            # storefront pages (catalog, cart, profile, ...)
│   ├── admin/                # admin pages (each loads admin.js)
│   └── assets/
│       ├── css/              # style.css, admin.css
│       ├── js/               # app.js (store), admin.js (dashboard)
│       └── images/           # placeholder.svg
├── database/
│   └── schema.sql            # run once to create the database
└── uploads/                  # created automatically: products / categories / users
```

> The browser never touches `backend/` directly. It calls `frontend/api.php?action=...`,
> which includes the API from inside the server.

---

## Getting started

### Requirements
- PHP **8.0+** with `pdo_mysql`, `fileinfo` and `mbstring`
- MySQL 5.7+ / MariaDB 10.3+
- Apache with `mod_rewrite` and `AllowOverride` enabled (XAMPP works out of the box)

### Installation (XAMPP example)

1. **Copy the project** to `C:\xampp\htdocs\kanaan` (or `/var/www/html/kanaan`).
2. **Create the database:** open phpMyAdmin → *Import* → choose `database/schema.sql`.
   (It creates `kanaan_db` and all tables.)
3. **Set the database credentials** in `backend/db.php`.
4. **Set the base path** in `backend/init.php`:
   ```php
   define('BASE_URL', '/kanaan');   // use '' if the project is at the server root
   ```
5. **Create the first admin** (see below).
6. **Open the site:**
   - Store: `http://localhost/kanaan/frontend/index.html`
   - Admin: `http://localhost/kanaan/frontend/admin/dashboard.html`
7. **Health check:** `http://localhost/kanaan/frontend/api.php?action=health` should return
   ```json
   {"ok":true,"app":"KANAAN API"}
   ```

---

## Configuration

| Setting             | File                | Default                | Notes                                   |
| ------------------- | ------------------- | ---------------------- | --------------------------------------- |
| DB host/name/user/pass | `backend/db.php` | `localhost` / `kanaan_db` / `root` / *(empty)* | Change for production |
| `BASE_URL`          | `backend/init.php`  | `/kanaan`              | Path of the project on the server       |
| `UPLOAD_MAX_BYTES`  | `backend/init.php`  | `2 * 1024 * 1024`      | Max image size (2 MB)                   |
| Allowed image types | `ImageUploader.php` | JPG, PNG, WEBP         | Checked by real file content, not extension |

---

## Creating the first admin

**Option A — CLI (recommended):**

```bash
php backend/create_admin.php "Your Name" you@example.com "a-strong-password"
```

Then **delete `create_admin.php`**.

**Option B — first-run setup screen:** open the admin page; if no admin exists yet, it offers
a one-time "First-time setup" form (`setup-admin`). It stops working as soon as one admin exists.
On a public server, create the admin **before** exposing the site (or use Option A).

---

## API reference

All requests go to `frontend/api.php?action=<name>`. Responses are JSON.
Errors look like `{"error": "<arabic>", "error_en": "<english>"}` with a proper HTTP status.

**Public**

| Action        | Method | Description                                   |
| ------------- | ------ | --------------------------------------------- |
| `health`      | GET    | Service check                                 |
| `products`    | GET    | List products (`q`, `category` filters)       |
| `product`     | GET    | One product (`id`)                            |
| `categories`  | GET    | List categories                               |
| `img`         | GET    | Serve an uploaded image (whitelisted paths)   |

**Account**

| Action              | Method | Auth    | Description                          |
| ------------------- | ------ | ------- | ------------------------------------ |
| `register`          | POST   | –       | Create a customer account            |
| `login` / `logout`  | POST / GET | –   | Sign in / out                        |
| `me`                | GET    | –       | Current user (or `null`)             |
| `profile`           | GET    | user    | Profile data                         |
| `profile-image`     | POST   | user    | Change profile photo                 |
| `my-images`, `user-image-upload` | GET / POST | user | Private photo gallery   |
| `change-password`   | POST   | user    | Requires the current password        |
| `setup-status`, `setup-admin` | GET / POST | – | First-run admin setup (once only) |

**Cart & orders**

| Action          | Method | Auth | Description                                     |
| --------------- | ------ | ---- | ----------------------------------------------- |
| `cart`          | GET    | –    | Items, count, total (prices read from the DB)   |
| `cart-add`, `cart-update`, `cart-remove` | POST | – | Modify the cart            |
| `orders-create` | POST   | user | Create an order from the cart (transactional)   |
| `my-orders`     | GET    | user | The customer's orders                           |
| `order`         | GET    | user | One order (owner or admin only)                 |

**Admin** (all require the `admin` role)

`admin-stats` · `admin-orders` · `admin-order` · `admin-order-update` · `admin-users` ·
`admin-user-images` · `admin-user-update` · `admin-user-delete` · `admin-product-save` ·
`admin-product-image` · `admin-product-delete` · `admin-category-save` · `admin-category-delete` ·
`admin-artisans` · `admin-logs`

**Examples**

```javascript
// list products matching a search term
const res  = await fetch('frontend/api.php?action=products&q=basket');
const data = await res.json();

// sign in
const r = await fetch('frontend/api.php?action=login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'a@b.com', password: '12345678' })
});
if (!r.ok) alert((await r.json()).error_en);
```

---

## Database

| Table           | Purpose                                                   |
| --------------- | --------------------------------------------------------- |
| `users`         | Accounts (`customer` / `admin`), hashed passwords         |
| `categories`    | Product categories (unique name)                          |
| `products`      | Products with price, stock, image, artisan name & story   |
| `orders`        | Orders with status, payment status and delivery details   |
| `order_items`   | Order lines (name and price are **snapshotted** at purchase time) |
| `user_images`   | Private user photo gallery                                |
| `activity_logs` | Audit trail of admin and order actions                    |

Order statuses: `Pending → Processing → Shipped → Delivered`, or `Cancelled`.
Payment statuses: `Unpaid`, `Paid` (cash on delivery by default).

---

## Security

- **SQL injection:** PDO with real prepared statements (`ATTR_EMULATE_PREPARES = false`) everywhere.
- **Passwords:** `password_hash()` / `password_verify()`, never stored or returned in plain text.
- **Sessions:** `HttpOnly`, `SameSite=Lax`, `Secure` on HTTPS, and `session_regenerate_id()` on login (anti session-fixation).
- **Roles:** `isAdmin()` re-checks the role **in the database** on every admin request, not just the session value.
- **Uploads:** real MIME detection (`finfo` + `getimagesize`), size limit, random 32-hex file names, whitelisted folders.
- **Private images:** user photos are served only to their owner or an admin; guessing a path returns `404`.
- **Orders:** totals are computed server-side from real prices; stock rows are locked (`FOR UPDATE`) inside a transaction to prevent overselling.
- **XSS:** all output is escaped (`e()` in PHP, `esc()` in JS).
- **Internal errors:** details go to the server log; users only see a generic message.
- **CSRF:** `csrf_token()` / `csrf_check()` helpers for classic forms; the JSON API relies on `SameSite=Lax` cookies and same-origin requests.

---

## Production checklist

- [ ] Create a **dedicated MySQL user** (not `root`) with only `SELECT, INSERT, UPDATE, DELETE` on `kanaan_db`
- [ ] Serve over **HTTPS**
- [ ] Create the admin, then **delete `backend/create_admin.php`**
- [ ] Make sure `backend/` is not web-accessible (keep its `.htaccess`)
- [ ] Disable PHP `display_errors`, keep `error_log` on
- [ ] Back up the database and the `uploads/` folder regularly
- [ ] Consider **rate-limiting login attempts** (not built in yet)

---

## نبذة بالعربي

**KANAAN** منصة تجارة إلكترونية للمنتجات الحرفية، ثنائية اللغة (عربي / إنجليزي) مع دعم كامل للـ RTL، ولوحة تحكم متكاملة للأدمن.

**المميزات:** كتالوج منتجات مع بحث وتصنيفات، سلة مشتريات تتحقق من المخزون، طلبات وسجل طلبات للعميل،
بروفايل وصور خاصة للمستخدم، وصفحة لكل منتج فيها اسم الحرفي وقصته.
أما لوحة الأدمن فتعمل كصفحة واحدة بدون إعادة تحميل: إحصائيات ورسم بياني للمبيعات، إدارة المنتجات والتصنيفات والطلبات والمستخدمين،
تنبيهات المخزون المنخفض، وسجل نشاطات كامل.

**التشغيل السريع:**
1. انسخ المشروع إلى `htdocs/kanaan`.
2. استورد `database/schema.sql` من phpMyAdmin.
3. عدّل بيانات الاتصال في `backend/db.php` والمسار `BASE_URL` في `backend/init.php`.
4. أنشئ الأدمن: `php backend/create_admin.php "الاسم" email "كلمة_مرور_قوية"` ثم احذف الملف.
5. افتح `http://localhost/kanaan/frontend/index.html`.

**الأمان:** استعلامات محضّرة، تشفير كلمات المرور، حماية الجلسات، فحص الصور من محتواها الحقيقي،
صلاحيات الأدمن تُفحص من قاعدة البيانات، وحماية المخزون من البيع المزدوج باستخدام Transactions.

---

## License

Add your license here (for example MIT) before publishing.