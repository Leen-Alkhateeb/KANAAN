-- ============================================================
-- KANAAN | كنعان — مخطط قاعدة البيانات (MySQL 8 / MariaDB 10.4+)
-- الاستيراد:  mysql -u root -p < database.sql
-- ============================================================
CREATE DATABASE IF NOT EXISTS kanaan_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kanaan_db;
SET NAMES utf8mb4;

CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  phone         VARCHAR(30) NULL,
  profile_image VARCHAR(255) NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE user_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_images_user (user_id),
  CONSTRAINT fk_user_images_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  image       VARCHAR(255) NULL,            -- مسار نسبي: uploads/categories/xxxx.jpg
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE products (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id   INT UNSIGNED NULL,
  name          VARCHAR(150) NOT NULL,
  description   TEXT NULL,
  price         DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock         INT UNSIGNED NOT NULL DEFAULT 0,
  image         VARCHAR(255) NULL,          -- مسار نسبي: uploads/products/xxxx.jpg
  artisan_name  VARCHAR(100) NULL,          -- اسم الحرفي
  artisan_story TEXT NULL,                  -- نبذة عن الحرفي
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_products_name (name),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id)
    REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE orders (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED NOT NULL,
  full_name      VARCHAR(100) NOT NULL,
  phone          VARCHAR(30)  NOT NULL,
  city           VARCHAR(80)  NOT NULL,
  address        VARCHAR(255) NOT NULL,
  notes          VARCHAR(500) NULL,
  total          DECIMAL(10,2) NOT NULL,
  payment_method ENUM('COD') NOT NULL DEFAULT 'COD',
  payment_status ENUM('Unpaid','Paid') NOT NULL DEFAULT 'Unpaid',
  status         ENUM('Pending','Processing','Shipped','Delivered','Cancelled') NOT NULL DEFAULT 'Pending',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id     INT UNSIGNED NOT NULL,
  product_id   INT UNSIGNED NULL,           -- يبقى السجل حتى لو حُذف المنتج
  product_name VARCHAR(150) NOT NULL,       -- لقطة من الاسم وقت الشراء
  unit_price   DECIMAL(10,2) NOT NULL,      -- لقطة من السعر وقت الشراء
  quantity     INT UNSIGNED NOT NULL,
  CONSTRAINT fk_items_order FOREIGN KEY (order_id)
    REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_items_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE activity_logs (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NULL,
  action     VARCHAR(60)  NOT NULL,
  details    VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_logs_created (created_at),
  CONSTRAINT fk_logs_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- بيانات تجريبية
INSERT INTO categories (name, description) VALUES
 ('التطريز الفلسطيني', 'ثياب وإكسسوارات بالتطريز اليدوي'),
 ('الفخار والخزف', 'قطع فخارية صُنعت يدوياً'),
 ('صابون نابلسي', 'صابون زيت الزيتون التقليدي');

INSERT INTO products (category_id, name, description, price, stock, artisan_name, artisan_story) VALUES
 (1, 'وسادة مطرزة بغرزة الصليب', 'وسادة قطنية بزخارف نجمة القدس.', 85.00, 10, 'أم محمد', 'حرفية من رام الله تطرّز منذ أربعين عاماً.'),
 (2, 'إبريق فخار خليلي', 'إبريق تقليدي مزخرف يدوياً.', 120.00, 5, 'أبو خليل', 'من عائلة خزافين في الخليل.'),
 (3, 'صابون نابلسي غار وزيتون (4 قطع)', 'صابون طبيعي 100%.', 45.00, 40, 'مصبنة النابلسي', 'تصنيع تقليدي منذ أكثر من قرن.');

-- حساب الأدمن الجاهز للتجربة (غيّر كلمة المرور بعد أول دخول من زر "تغيير كلمة المرور" في لوحة الإدارة)
--   البريد:      admin@kanaan.ps
--   كلمة المرور: Kanaan@2026
INSERT INTO users (name, email, password_hash, role) VALUES
 ('مدير كنعان', 'admin@kanaan.ps', '$2y$10$brwEynXUMwe6infO86BdrOwlR2HoVWobmoIDoLrRjvoe/4wlFgkLi', 'admin')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin';
