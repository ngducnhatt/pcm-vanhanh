-- Migration 0009: thong bao theo don hang cho tung thanh vien
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
