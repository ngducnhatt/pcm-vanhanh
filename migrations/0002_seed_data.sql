-- Migration 0002: Seed Data
-- Users for all 8 roles, sample PC components, and orders at various state machine stages

-- 1. Insert Users for each role
INSERT OR IGNORE INTO users (id, name, phone, email, role, is_active) VALUES
  ('usr_admin', 'Nguyễn Quản Trị (Admin)', '0901000001', 'admin@pcshop.vn', 'admin', 1),
  ('usr_sales', 'Trần Sale (Kinh Doanh)', '0901000002', 'sale@pcshop.vn', 'kinh_doanh', 1),
  ('usr_warehouse', 'Lê Thủ Kho (Kho)', '0901000003', 'kho@pcshop.vn', 'kho', 1),
  ('usr_tech', 'Võ Kỹ Thuật (Kỹ Thuật)', '0901000004', 'kythuat@pcshop.vn', 'ky_thuat', 1),
  ('usr_tech_mgr', 'Phạm Quản Lý KT (QL Kỹ Thuật)', '0901000005', 'qlkythuat@pcshop.vn', 'quan_ly_ky_thuat', 1),
  ('usr_warranty', 'Hoàng Bảo Hành (Bảo Hành)', '0901000006', 'baohanh@pcshop.vn', 'bao_hanh', 1),
  ('usr_ship_mgr', 'Đỗ Quản Lý Ship (QL Ship)', '0901000007', 'qlship@pcshop.vn', 'quan_ly_ship', 1),
  ('usr_shipper1', 'Bùi Shipper Hỏa Tốc (Shipper 1)', '0901000008', 'shipper1@pcshop.vn', 'shipper', 1),
  ('usr_shipper2', 'Đặng Shipper Nội Thành (Shipper 2)', '0901000009', 'shipper2@pcshop.vn', 'shipper', 1);

-- 2. Insert Products
INSERT OR IGNORE INTO products (id, sku, name, unit_price, stock_qty, category) VALUES
  ('prod_1', 'CPU-I5-14400F', 'CPU Intel Core i5 14400F 4.7GHz 20MB Cache', 4590000, 18, 'CPU'),
  ('prod_2', 'CPU-R7-7800X3D', 'CPU AMD Ryzen 7 7800X3D 5.0GHz 96MB Cache', 10490000, 6, 'CPU'),
  ('prod_3', 'MB-B760M-ASUS', 'Mainboard ASUS TUF Gaming B760M-PLUS WIFI D4', 3890000, 14, 'Mainboard'),
  ('prod_4', 'RAM-COR-32G-DDR5', 'RAM Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz', 2850000, 25, 'RAM'),
  ('prod_5', 'VGA-RTX-4070S', 'VGA Colorful GeForce RTX 4070 Super NB EX 12GB', 16990000, 9, 'VGA'),
  ('prod_6', 'VGA-RTX-4060', 'VGA ASUS Dual GeForce RTX 4060 EVO OC 8GB', 8290000, 15, 'VGA'),
  ('prod_7', 'SSD-SAM-990P-1T', 'SSD Samsung 990 PRO 1TB PCIe 4.0 M.2 NVMe', 2790000, 30, 'Ổ cứng SSD'),
  ('prod_8', 'PSU-COR-750W', 'Nguồn máy tính Corsair RM750e 750W 80 Plus Gold ATX 3.0', 2690000, 12, 'Nguồn'),
  ('prod_9', 'CASE-MONTECH-903', 'Vỏ Case Montech AIR 903 MAX Black (4 Fan ARGB)', 1590000, 8, 'Vỏ Case'),
  ('prod_10', 'COOL-AK620', 'Tản nhiệt khí DeepCool AK620 Digital Black', 1650000, 16, 'Tản nhiệt');

-- 3. Insert Orders at various states

-- Order 1: DRAFT (Kinh doanh đang soạn nháp)
INSERT OR IGNORE INTO orders (id, invoice_no, invoice_date, customer_name, customer_phone, customer_email, tags, note, sales_user_id, status, payment_status, total_amount, paid_amount) VALUES
  ('ord_draft_1', 'HD-2026-001', '2026-09-25', 'Anh Hoàng Nam', '0912345678', 'hoangnam@gmail.com', '["moi"]', 'Khách hẹn chiều mai chốt thêm màn hình', 'usr_sales', 'draft', 'unpaid', 8480000, 0);

INSERT OR IGNORE INTO order_items (id, order_id, product_id, quantity, unit_price, serial_number) VALUES
  ('item_1_1', 'ord_draft_1', 'prod_1', 1, 4590000, NULL),
  ('item_1_2', 'ord_draft_1', 'prod_3', 1, 3890000, NULL);

INSERT OR IGNORE INTO order_status_history (id, order_id, status, changed_by_user_id, note) VALUES
  ('hist_1_1', 'ord_draft_1', 'draft', 'usr_sales', 'Lưu nháp đơn hàng linh kiện nâng cấp');


-- Order 2: KHO_PENDING (Đã cọc một phần, đang chờ kho chuẩn bị xuất & quét serial)
INSERT OR IGNORE INTO orders (id, invoice_no, invoice_date, customer_name, customer_phone, customer_email, tags, note, sales_user_id, status, payment_status, total_amount, paid_amount) VALUES
  ('ord_kho_1', 'HD-2026-002', '2026-09-25', 'Chị Mai Lan', '0987654321', 'mailan@company.vn', '["moi", "kithuat"]', 'Khách cần lắp ráp hoàn chỉnh thành bộ PC và cài Win bản quyền', 'usr_sales', 'kho_pending', 'partial', 25320000, 5000000);

INSERT OR IGNORE INTO order_items (id, order_id, product_id, quantity, unit_price, serial_number) VALUES
  ('item_2_1', 'ord_kho_1', 'prod_1', 1, 4590000, NULL),
  ('item_2_2', 'ord_kho_1', 'prod_3', 1, 3890000, NULL),
  ('item_2_3', 'ord_kho_1', 'prod_5', 1, 16990000, NULL),
  ('item_2_4', 'ord_kho_1', 'prod_9', 1, 1590000, NULL);

INSERT OR IGNORE INTO payments (id, order_id, method, amount, collected_by_user_id) VALUES
  ('pay_2_1', 'ord_kho_1', 'qr', 5000000, 'usr_sales');

INSERT OR IGNORE INTO order_status_history (id, order_id, status, changed_by_user_id, note) VALUES
  ('hist_2_1', 'ord_kho_1', 'new', 'usr_sales', 'Kinh doanh tạo đơn hàng mới, khách cọc QR 5.000.000đ'),
  ('hist_2_2', 'ord_kho_1', 'kho_pending', 'usr_sales', 'Chuyển hàng đợi kho chờ bốc hàng và gán serial');


-- Order 3: KITHUAT_PENDING (Kho đã xuất có serial đầy đủ, đang chờ kỹ thuật ráp máy & test)
INSERT OR IGNORE INTO orders (id, invoice_no, invoice_date, customer_name, customer_phone, customer_email, tags, note, sales_user_id, status, payment_status, total_amount, paid_amount) VALUES
  ('ord_tech_1', 'HD-2026-003', '2026-09-24', 'Nguyễn Tiến Đạt', '0933445566', 'tiendat.dev@gmail.com', '["moi", "kithuat"]', 'Yêu cầu đi dây giấu gọn, chia 2 phân vùng SSD C: và D:', 'usr_sales', 'kithuat_pending', 'full', 33810000, 33810000);

INSERT OR IGNORE INTO order_items (id, order_id, product_id, quantity, unit_price, serial_number) VALUES
  ('item_3_1', 'ord_tech_1', 'prod_2', 1, 10490000, 'AMD7800-SN882910'),
  ('item_3_2', 'ord_tech_1', 'prod_4', 1, 2850000, 'COR-DDR5-6000-A91'),
  ('item_3_3', 'ord_tech_1', 'prod_5', 1, 16990000, 'RTX4070S-CLF-77402'),
  ('item_3_4', 'ord_tech_1', 'prod_7', 1, 2790000, 'SAM990P-VN-09381'),
  ('item_3_5', 'ord_tech_1', 'prod_8', 1, 2690000, 'COR-RM750E-44820');

INSERT OR IGNORE INTO payments (id, order_id, method, amount, collected_by_user_id) VALUES
  ('pay_3_1', 'ord_tech_1', 'transfer', 33810000, 'usr_sales');

INSERT OR IGNORE INTO order_status_history (id, order_id, status, changed_by_user_id, note) VALUES
  ('hist_3_1', 'ord_tech_1', 'new', 'usr_sales', 'Kinh doanh tạo đơn thanh toán đủ'),
  ('hist_3_2', 'ord_tech_1', 'kho_pending', 'usr_sales', 'Chờ xuất kho'),
  ('hist_3_3', 'ord_tech_1', 'kho_done', 'usr_warehouse', 'Kho đã xuất đủ linh kiện và quét mã vạch serial'),
  ('hist_3_4', 'ord_tech_1', 'kithuat_pending', 'usr_warehouse', 'Tự động chuyển hàng đợi kỹ thuật lắp ráp theo tag kithuat');


-- Order 4: BAOHANH_PENDING (Linh kiện gửi bảo hành hãng, kiểm tra và đổi trả)
INSERT OR IGNORE INTO orders (id, invoice_no, invoice_date, customer_name, customer_phone, customer_email, tags, note, sales_user_id, status, payment_status, related_order_id, total_amount, paid_amount) VALUES
  ('ord_bh_1', 'HD-2026-004', '2026-09-24', 'Lê Hữu Thắng', '0944556677', 'thanglh@gmail.com', '["baohanh"]', 'Card màn hình chập chờn cổng DisplayPort, đổi mới hoặc gửi hãng', 'usr_sales', 'baohanh_pending', 'full', 'ord_tech_1', 0, 0);

INSERT OR IGNORE INTO order_items (id, order_id, product_id, quantity, unit_price, serial_number) VALUES
  ('item_4_1', 'ord_bh_1', 'prod_5', 1, 0, 'RTX4070S-CLF-OLD999');

INSERT OR IGNORE INTO order_status_history (id, order_id, status, changed_by_user_id, note) VALUES
  ('hist_4_1', 'ord_bh_1', 'new', 'usr_sales', 'Kinh doanh tạo phiếu bảo hành liên kết HD-2026-003'),
  ('hist_4_2', 'ord_bh_1', 'kho_done', 'usr_warehouse', 'Kho tiếp nhận sản phẩm bảo hành'),
  ('hist_4_3', 'ord_bh_1', 'baohanh_pending', 'usr_warehouse', 'Chuyển bộ phận bảo hành thẩm định lỗi');


-- Order 5: SHIP_PENDING (Kỹ thuật và bảo hành xong, chờ Quản lý Ship phân công)
INSERT OR IGNORE INTO orders (id, invoice_no, invoice_date, customer_name, customer_phone, customer_email, tags, note, sales_user_id, status, payment_status, total_amount, paid_amount) VALUES
  ('ord_ship_1', 'HD-2026-005', '2026-09-23', 'Vũ Đình Cường', '0977889900', 'cuongvd@fpt.com.vn', '["moi"]', 'Giao giờ hành chính, gọi trước 15 phút', 'usr_sales', 'ship_pending', 'unpaid', 7440000, 0);

INSERT OR IGNORE INTO order_items (id, order_id, product_id, quantity, unit_price, serial_number) VALUES
  ('item_5_1', 'ord_ship_1', 'prod_1', 1, 4590000, 'I5-14400F-SRN399'),
  ('item_5_2', 'ord_ship_1', 'prod_4', 1, 2850000, 'COR-D5-449199');

INSERT OR IGNORE INTO order_status_history (id, order_id, status, changed_by_user_id, note) VALUES
  ('hist_5_1', 'ord_ship_1', 'kho_done', 'usr_warehouse', 'Kho xuất linh kiện thành công'),
  ('hist_5_2', 'ord_ship_1', 'ship_pending', 'usr_warehouse', 'Không có tag kỹ thuật/bảo hành, chuyển thẳng hàng đợi giao hàng');


-- Order 6: SHIP_DANGIAO (Shipper 1 đang đi giao, chưa thu đủ tiền COD)
INSERT OR IGNORE INTO orders (id, invoice_no, invoice_date, customer_name, customer_phone, customer_email, tags, note, sales_user_id, status, payment_status, total_amount, paid_amount) VALUES
  ('ord_shipping_1', 'HD-2026-006', '2026-09-23', 'Dương Quốc Bảo', '0966778899', 'baodq@tech.vn', '["moi"]', 'Giao toà nhà Landmark 81, tầng 15', 'usr_sales', 'ship_dangiao', 'partial', 16990000, 2000000);

INSERT OR IGNORE INTO order_items (id, order_id, product_id, quantity, unit_price, serial_number) VALUES
  ('item_6_1', 'ord_shipping_1', 'prod_5', 1, 16990000, 'RTX4070S-991204');

INSERT OR IGNORE INTO payments (id, order_id, method, amount, collected_by_user_id) VALUES
  ('pay_6_1', 'ord_shipping_1', 'transfer', 2000000, 'usr_sales');

INSERT OR IGNORE INTO shipments (id, order_id, shipper_id, assigned_by_user_id, address, distance_km, km_source) VALUES
  ('ship_6_1', 'ord_shipping_1', 'usr_shipper1', 'usr_ship_mgr', '720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP. Hồ Chí Minh', 6.8, 'gg_map');

INSERT OR IGNORE INTO order_status_history (id, order_id, status, changed_by_user_id, note) VALUES
  ('hist_6_1', 'ord_shipping_1', 'ship_assigned', 'usr_ship_mgr', 'Phân công Shipper Hỏa Tốc (6.8 km)'),
  ('hist_6_2', 'ord_shipping_1', 'ship_dangiao', 'usr_shipper1', 'Shipper đã lấy hàng từ kho, đang di chuyển giao khách');


-- Order 7: COMPLETED (Đã giao hàng và thanh toán đủ 100%)
INSERT OR IGNORE INTO orders (id, invoice_no, invoice_date, customer_name, customer_phone, customer_email, tags, note, sales_user_id, status, payment_status, total_amount, paid_amount) VALUES
  ('ord_comp_1', 'HD-2026-007', '2026-09-22', 'Phạm Quỳnh Anh', '0922334455', 'quynhanh@agency.vn', '["moi", "kithuat"]', 'Giao máy dựng đồ hoạ render 3D', 'usr_sales', 'completed', 'full', 29330000, 29330000);

INSERT OR IGNORE INTO order_items (id, order_id, product_id, quantity, unit_price, serial_number) VALUES
  ('item_7_1', 'ord_comp_1', 'prod_2', 1, 10490000, 'AMD7800-DONE-01'),
  ('item_7_2', 'ord_comp_1', 'prod_5', 1, 16990000, 'RTX4070S-DONE-02'),
  ('item_7_3', 'ord_comp_1', 'prod_7', 1, 2790000, 'SSD990-DONE-03');

INSERT OR IGNORE INTO payments (id, order_id, method, amount, collected_by_user_id) VALUES
  ('pay_7_1', 'ord_comp_1', 'cash', 29330000, 'usr_shipper1');

INSERT OR IGNORE INTO shipments (id, order_id, shipper_id, assigned_by_user_id, address, distance_km, km_source) VALUES
  ('ship_7_1', 'ord_comp_1', 'usr_shipper1', 'usr_ship_mgr', '124 Khánh Hội, Quận 4, TP. Hồ Chí Minh', 3.5, 'gg_map');

INSERT OR IGNORE INTO order_status_history (id, order_id, status, changed_by_user_id, note) VALUES
  ('hist_7_1', 'ord_comp_1', 'ship_done', 'usr_shipper1', 'Đã giao máy tận tay khách hàng'),
  ('hist_7_2', 'ord_comp_1', 'completed', 'usr_shipper1', 'Hoàn tất đơn hàng (Đã giao xong + Khách thanh toán đủ)');


-- Order 8: CANCELLED (Kinh doanh đã hủy)
INSERT OR IGNORE INTO orders (id, invoice_no, invoice_date, customer_name, customer_phone, customer_email, tags, note, sales_user_id, status, payment_status, total_amount, paid_amount) VALUES
  ('ord_canc_1', 'HD-2026-008', '2026-09-22', 'Trần Đình Trọng', '0955667788', 'trongtd@gmail.com', '["moi"]', 'Khách đổi ý sang mua laptop, hủy đơn linh kiện', 'usr_sales', 'cancelled', 'unpaid', 16990000, 0);

INSERT OR IGNORE INTO order_items (id, order_id, product_id, quantity, unit_price, serial_number) VALUES
  ('item_8_1', 'ord_canc_1', 'prod_5', 1, 16990000, NULL);

INSERT OR IGNORE INTO order_status_history (id, order_id, status, changed_by_user_id, note) VALUES
  ('hist_8_1', 'ord_canc_1', 'cancelled', 'usr_sales', 'Khách đổi ý hủy đơn trước khi xuất kho');
