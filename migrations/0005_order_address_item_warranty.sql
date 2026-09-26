ALTER TABLE orders ADD COLUMN customer_address TEXT;

ALTER TABLE order_items
ADD COLUMN warranty_months INTEGER NOT NULL DEFAULT 36 CHECK (warranty_months >= 0);
