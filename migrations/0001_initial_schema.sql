-- Migration 0001: Initial Schema for Computer Hardware Sales & Operations Management
-- Cloudflare D1 / SQLite compatible

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK(role IN (
    'admin',
    'kinh_doanh',
    'kho',
    'ky_thuat',
    'quan_ly_ky_thuat',
    'bao_hanh',
    'quan_ly_ship',
    'shipper'
  )),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  unit_price INTEGER NOT NULL,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  invoice_no TEXT UNIQUE NOT NULL,
  invoice_date TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  tags TEXT NOT NULL DEFAULT '[]', -- JSON array of tags, e.g. ["moi", "kithuat", "baohanh", "thu_cu"]
  note TEXT,
  sales_user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN (
    'draft',
    'new',
    'kho_pending',
    'kho_done',
    'kithuat_pending',
    'kithuat_done',
    'baohanh_pending',
    'baohanh_done',
    'ship_pending',
    'ship_assigned',
    'ship_dangiao',
    'ship_done',
    'completed',
    'cancelled'
  )),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'partial', 'full')),
  related_order_id TEXT REFERENCES orders(id), -- Cho đơn bảo hành liên kết tới đơn gốc
  total_amount INTEGER NOT NULL DEFAULT 0,
  paid_amount INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL,
  serial_number TEXT, -- điền khi kho xuất
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by_user_id TEXT NOT NULL REFERENCES users(id),
  note TEXT,
  snapshot_serials TEXT, -- JSON snapshot lưu lại serial cũ khi bị rollback
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK(method IN ('qr', 'cash', 'transfer')),
  amount INTEGER NOT NULL,
  collected_by_user_id TEXT NOT NULL REFERENCES users(id),
  paid_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  shipper_id TEXT NOT NULL REFERENCES users(id),
  assigned_by_user_id TEXT NOT NULL REFERENCES users(id),
  address TEXT NOT NULL,
  distance_km REAL NOT NULL,
  km_source TEXT NOT NULL CHECK(km_source IN ('gg_map', 'manual')),
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_sales ON orders(sales_user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_shipper ON shipments(shipper_id);
