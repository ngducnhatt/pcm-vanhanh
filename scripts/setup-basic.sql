-- ============================================================
-- PCM Van Hanh - Tables + indexes + admin (KHONG gom tao database)
-- Phan tao database ban chay rieng (scripts/create-database.sql).
-- Khong can migrate, khong co du lieu mau.
--
-- Cach dung 1 (phpMyAdmin):
--   http://localhost/phpmyadmin -> chon database pcm_vanhanh
--   -> tab SQL -> copy/paste toan bo file nay -> Go
-- Cach dung 2 (MySQL client, sau khi da tao database):
--   mysql -u root pcm_vanhanh < scripts/setup-basic.sql
-- Xong la chay app ngay: npm run dev (khong can db:migrate, db:admin)
-- ============================================================

USE pcm_vanhanh;

-- ---------- users (final state sau 0001+0003+0004+0007) ----------
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email VARCHAR(255) UNIQUE,
  role VARCHAR(32) NULL CHECK(role IN (
    'admin','kinh_doanh','kho','ky_thuat',
    'quan_ly_ky_thuat','bao_hanh','quan_ly_ship','shipper'
  )),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  username VARCHAR(255),
  password_hash TEXT,
  last_login_at TEXT,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  updated_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ---------- user_roles (0006) ----------
CREATE TABLE IF NOT EXISTS user_roles (
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(32) NOT NULL CHECK(role IN (
    'admin','kinh_doanh','kho','ky_thuat',
    'quan_ly_ky_thuat','bao_hanh','quan_ly_ship','shipper'
  )),
  PRIMARY KEY (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- ---------- products ----------
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  sku VARCHAR(255) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  unit_price INTEGER NOT NULL,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------- orders (+ customer_address o 0005) ----------
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  invoice_no VARCHAR(255) UNIQUE NOT NULL,
  invoice_date TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  customer_email TEXT,
  tags VARCHAR(1024) NOT NULL DEFAULT '[]',
  note TEXT,
  sales_user_id VARCHAR(64) NOT NULL REFERENCES users(id),
  status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK(status IN (
    'draft','new','kho_pending','kho_done',
    'kithuat_pending','kithuat_done',
    'baohanh_pending','baohanh_done',
    'ship_pending','ship_assigned','ship_dangiao','ship_done',
    'completed','cancelled'
  )),
  payment_status VARCHAR(32) NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'partial', 'full')),
  related_order_id VARCHAR(64) REFERENCES orders(id),
  total_amount INTEGER NOT NULL DEFAULT 0,
  paid_amount INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------- order_items (+ warranty_months o 0005) ----------
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL,
  warranty_months INTEGER NOT NULL DEFAULT 36 CHECK (warranty_months >= 0),
  serial_number TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL,
  changed_by_user_id VARCHAR(64) NOT NULL REFERENCES users(id),
  note TEXT,
  snapshot_serials TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method VARCHAR(32) NOT NULL CHECK(method IN ('qr', 'cash', 'transfer')),
  amount INTEGER NOT NULL,
  collected_by_user_id VARCHAR(64) NOT NULL REFERENCES users(id),
  paid_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shipments (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  shipper_id VARCHAR(64) NOT NULL REFERENCES users(id),
  assigned_by_user_id VARCHAR(64) NOT NULL REFERENCES users(id),
  address TEXT NOT NULL,
  distance_km REAL NOT NULL,
  km_source VARCHAR(32) NOT NULL CHECK(km_source IN ('gg_map', 'manual')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_sales ON orders(sales_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_invoice_date ON orders(invoice_date);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_history_created ON order_status_history(created_at);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_shipper ON shipments(shipper_id);

-- ---------- sessions + audit_log (0003) ----------
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_agent TEXT,
  ip VARCHAR(64),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at VARCHAR(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS auth_audit_log (
  id VARCHAR(64) PRIMARY KEY,
  actor_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  actor_name TEXT,
  action VARCHAR(64) NOT NULL,
  target_user_id VARCHAR(64),
  target_name TEXT,
  detail TEXT,
  ip VARCHAR(64),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_created ON auth_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_audit_actor ON auth_audit_log(actor_user_id);

-- ---------- notifications (0009): thong bao theo don cho tung thanh vien ----------
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id VARCHAR(64) NULL REFERENCES orders(id) ON DELETE CASCADE,
  invoice_no VARCHAR(255) NULL,
  kind VARCHAR(64) NOT NULL DEFAULT 'order',
  title VARCHAR(255) NOT NULL,
  message TEXT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_order ON notifications(order_id);

-- ---------- danh dau migrate da xong (de app khong chay lai) ----------
CREATE TABLE IF NOT EXISTS schema_migrations (
  name VARCHAR(255) PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO schema_migrations (name) VALUES
  ('0001_initial_schema.sql'),
  ('0003_auth_accounts.sql'),
  ('0004_simplify_password.sql'),
  ('0005_order_address_item_warranty.sql'),
  ('0006_user_roles.sql'),
  ('0007_drop_role_not_null.sql'),
  ('0008_security_indexes.sql'),
  ('0009_notifications.sql');

-- ---------- admin mac dinh: admin / admin ----------
-- Hash PBKDF2-SHA256 210k vong cua mat khau "admin", tao bang lib/crypto.ts
INSERT IGNORE INTO users
  (id, name, phone, email, role, is_active, username, password_hash, failed_login_count, updated_at)
VALUES
  ('usr_admin_01', 'Administrator', '0901234567', 'admin@localhost', 'admin', 1, 'admin',
   'pbkdf2_sha256$210000$U6XwfBR0hmjKHSWd0C9eLA==$78j0bfizulZtfcsARLPNTKvegrxzvL+243qemoSMkgg=',
   0, CURRENT_TIMESTAMP);

INSERT IGNORE INTO user_roles (user_id, role) VALUES ('usr_admin_01', 'admin');
