-- Migration 0010: Khoá ngoại thật cho MariaDB/XAMPP
--
-- Vì sao cần migration này:
--   MariaDB (bản XAMPP dùng) chỉ chấp nhận khoá ngoại khai báo ở cấp bảng.
--   Cú pháp `cot VARCHAR(64) REFERENCES users(id)` trong 0001 được MariaDB
--   phân tích cú pháp nhưng BỎ QUA, nên trước 0010 không có FK nào được tạo.
--   Hệ quả: xoá order/user không cascade, dữ liệu con có thể mồ côi.
--
-- Migration này thêm FK cho toàn bộ quan hệ đang dùng trong code.
-- Chạy một lần trên mỗi database (được ghi vào schema_migrations).

-- 1. orders ---------------------------------------------------------------
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_sales_user
    FOREIGN KEY (sales_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_orders_related_order
    FOREIGN KEY (related_order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- 2. order_items ----------------------------------------------------------
ALTER TABLE order_items
  ADD CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

-- 3. order_status_history -------------------------------------------------
ALTER TABLE order_status_history
  ADD CONSTRAINT fk_order_history_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_order_history_user
    FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE RESTRICT;

-- 4. payments -------------------------------------------------------------
ALTER TABLE payments
  ADD CONSTRAINT fk_payments_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_payments_user
    FOREIGN KEY (collected_by_user_id) REFERENCES users(id) ON DELETE RESTRICT;

-- 5. shipments (mỗi đơn chỉ có tối đa 1 bản ghi giao hàng) ----------------
ALTER TABLE shipments
  ADD CONSTRAINT fk_shipments_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_shipments_shipper
    FOREIGN KEY (shipper_id) REFERENCES users(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_shipments_assigned_by
    FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  ADD UNIQUE KEY uq_shipments_order (order_id);

-- 6. sessions -------------------------------------------------------------
ALTER TABLE sessions
  ADD CONSTRAINT fk_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 7. user_roles -----------------------------------------------------------
ALTER TABLE user_roles
  ADD CONSTRAINT fk_user_roles_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 8. auth_audit_log (giữ log khi user bị xoá) -----------------------------
ALTER TABLE auth_audit_log
  ADD CONSTRAINT fk_audit_actor
    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 9. notifications --------------------------------------------------------
ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_notifications_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
