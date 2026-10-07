-- Migration 0008: index cho filter/sort thuc te (khong doi kieu cot de tranh vo DB cu)
CREATE INDEX IF NOT EXISTS idx_orders_invoice_date ON orders(invoice_date);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_history_created ON order_status_history(created_at);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
