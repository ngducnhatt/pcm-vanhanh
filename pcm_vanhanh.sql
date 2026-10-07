-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th10 07, 2026 lúc 11:03 PM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `pcm_vanhanh`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `auth_audit_log`
--

CREATE TABLE `auth_audit_log` (
  `id` varchar(64) NOT NULL,
  `actor_user_id` varchar(64) DEFAULT NULL,
  `actor_name` text DEFAULT NULL,
  `action` varchar(64) NOT NULL,
  `target_user_id` varchar(64) DEFAULT NULL,
  `target_name` text DEFAULT NULL,
  `detail` text DEFAULT NULL,
  `ip` varchar(64) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `auth_audit_log`
--

INSERT INTO `auth_audit_log` (`id`, `actor_user_id`, `actor_name`, `action`, `target_user_id`, `target_name`, `detail`, `ip`, `created_at`) VALUES
('log_muygs0fghu43k5rf', 'usr_admin_01', 'Administrator', 'login_success', 'usr_admin_01', 'Administrator', NULL, '::1', '2026-10-08 01:51:50'),
('log_muyjico7n87qcqsp', 'usr_admin_01', 'Administrator', 'user_created', 'usr_nghitq_muyjico0', 'Trần Quang Nghị', '{\"username\":\"nghitq\",\"roles\":[\"kho\"],\"is_active\":true,\"generated_password\":false}', NULL, '2026-10-08 03:08:19'),
('log_muyjjbfhtuyq47d', 'usr_admin_01', 'Administrator', 'user_created', 'usr_tuannm_muyjjbfc', 'Nguyễn Mạnh Tuấn', '{\"username\":\"tuannm\",\"roles\":[\"kinh_doanh\"],\"is_active\":true,\"generated_password\":false}', NULL, '2026-10-08 03:09:04'),
('log_muyjli8kpalxyaz', 'usr_admin_01', 'Administrator', 'user_created', 'usr_congdt_muyjli8g', 'Đỗ Thành Công', '{\"username\":\"congdt\",\"roles\":[\"ky_thuat\"],\"is_active\":true,\"generated_password\":false}', NULL, '2026-10-08 03:10:46'),
('log_muyjm9unmsr7naki', 'usr_admin_01', 'Administrator', 'user_created', 'usr_huynq_muyjm9uj', 'Nguyễn Quang Huy', '{\"username\":\"huynq\",\"roles\":[\"quan_ly_ship\"],\"is_active\":true,\"generated_password\":false}', NULL, '2026-10-08 03:11:22'),
('log_muyjna4duv8bx4l', 'usr_admin_01', 'Administrator', 'user_created', 'usr_nhatnd_muyjna49', 'Nguyễn Đức Nhật', '{\"username\":\"nhatnd\",\"roles\":[\"shipper\"],\"is_active\":true,\"generated_password\":false}', NULL, '2026-10-08 03:12:09'),
('log_muyl1lj3lk2szqr', 'usr_nghitq_muyjico0', 'Trần Quang Nghị', 'login_success', 'usr_nghitq_muyjico0', 'Trần Quang Nghị', NULL, '::1', '2026-10-08 03:51:16'),
('log_muyl1vwqnkrr5yl', 'usr_nghitq_muyjico0', 'Trần Quang Nghị', 'logout', 'usr_nghitq_muyjico0', 'Trần Quang Nghị', NULL, '::1', '2026-10-08 03:51:30'),
('log_muyl2280f634tupl', 'usr_tuannm_muyjjbfc', 'Nguyễn Mạnh Tuấn', 'login_success', 'usr_tuannm_muyjjbfc', 'Nguyễn Mạnh Tuấn', NULL, '::1', '2026-10-08 03:51:38'),
('log_muyl2upudnburv9i', 'usr_tuannm_muyjjbfc', 'Nguyễn Mạnh Tuấn', 'order_created', NULL, 'HD-20261007-001', '{\"order_id\":\"ord_1791406335210_w1inf\",\"total\":47950000}', '::1', '2026-10-08 03:52:15'),
('log_muyl453qyyv2mqo0', 'usr_tuannm_muyjjbfc', 'Nguyễn Mạnh Tuấn', 'logout', 'usr_tuannm_muyjjbfc', 'Nguyễn Mạnh Tuấn', NULL, '::1', '2026-10-08 03:53:15'),
('log_muyl46zjfxx7pvbs', 'usr_nghitq_muyjico0', 'Trần Quang Nghị', 'login_success', 'usr_nghitq_muyjico0', 'Trần Quang Nghị', NULL, '::1', '2026-10-08 03:53:17'),
('log_muyl5532lbt1tpsm', 'usr_nghitq_muyjico0', 'Trần Quang Nghị', 'logout', 'usr_nghitq_muyjico0', 'Trần Quang Nghị', NULL, '::1', '2026-10-08 03:54:01'),
('log_muyl5aixxogd9mvf', 'usr_tuannm_muyjjbfc', 'Nguyễn Mạnh Tuấn', 'login_success', 'usr_tuannm_muyjjbfc', 'Nguyễn Mạnh Tuấn', NULL, '::1', '2026-10-08 03:54:09'),
('log_muyl5rwx5wd0ie6g', 'usr_tuannm_muyjjbfc', 'Nguyễn Mạnh Tuấn', 'logout', 'usr_tuannm_muyjjbfc', 'Nguyễn Mạnh Tuấn', NULL, '::1', '2026-10-08 03:54:31'),
('log_muyl5ys3zhshcdo9', 'usr_congdt_muyjli8g', 'Đỗ Thành Công', 'login_success', 'usr_congdt_muyjli8g', 'Đỗ Thành Công', NULL, '::1', '2026-10-08 03:54:40'),
('log_muyl6bxlkozltah5', 'usr_congdt_muyjli8g', 'Đỗ Thành Công', 'order_status_changed', NULL, 'HD-20261007-001', '{\"order_id\":\"ord_1791406335210_w1inf\",\"action\":\"complete_kithuat\",\"from\":\"kithuat_pending\",\"to\":\"ship_pending\"}', '::1', '2026-10-08 03:54:57'),
('log_muyl6muyigdfvx8o', 'usr_congdt_muyjli8g', 'Đỗ Thành Công', 'logout', 'usr_congdt_muyjli8g', 'Đỗ Thành Công', NULL, '::1', '2026-10-08 03:55:11'),
('log_muyl6qqwhzhgl62u', 'usr_nghitq_muyjico0', 'Trần Quang Nghị', 'login_success', 'usr_nghitq_muyjico0', 'Trần Quang Nghị', NULL, '::1', '2026-10-08 03:55:16'),
('log_muyl6wpw7ibjp6qw', 'usr_nghitq_muyjico0', 'Trần Quang Nghị', 'logout', 'usr_nghitq_muyjico0', 'Trần Quang Nghị', NULL, '::1', '2026-10-08 03:55:24'),
('log_muyl7h9gavfufsxc', NULL, 'Nguyễn Quang Huy', 'login_failed', 'usr_huynq_muyjm9uj', 'Nguyễn Quang Huy', '{\"reason\":\"invalid_credentials\",\"failed_count\":1,\"locked\":false}', '::1', '2026-10-08 03:55:51'),
('log_muyl7n66sxmkjmoy', NULL, 'Nguyễn Quang Huy', 'login_failed', 'usr_huynq_muyjm9uj', 'Nguyễn Quang Huy', '{\"reason\":\"invalid_credentials\",\"failed_count\":2,\"locked\":false}', '::1', '2026-10-08 03:55:58'),
('log_muyl7snb1xmgheah', 'usr_admin_01', 'Administrator', 'password_reset', 'usr_huynq_muyjm9uj', 'Nguyễn Quang Huy', '{\"changes\":[\"phone\",\"roles:quan_ly_ship->quan_ly_ship\",\"password\"],\"sessions_revoked\":true}', NULL, '2026-10-08 03:56:05'),
('log_muyl7vq73fsjm4qs', 'usr_huynq_muyjm9uj', 'Nguyễn Quang Huy', 'login_success', 'usr_huynq_muyjm9uj', 'Nguyễn Quang Huy', NULL, '::1', '2026-10-08 03:56:09'),
('log_muyl8g9rfwdkixlm', 'usr_huynq_muyjm9uj', 'Nguyễn Quang Huy', 'order_shipment_assigned', NULL, 'HD-20261007-001', '{\"order_id\":\"ord_1791406335210_w1inf\",\"shipper_id\":\"usr_nhatnd_muyjna49\",\"distance_km\":2.8}', '::1', '2026-10-08 03:56:36'),
('log_muyl8xlv8agi8t2o', 'usr_huynq_muyjm9uj', 'Nguyễn Quang Huy', 'logout', 'usr_huynq_muyjm9uj', 'Nguyễn Quang Huy', NULL, '::1', '2026-10-08 03:56:58'),
('log_muyl9bdpjcsvkflq', 'usr_nhatnd_muyjna49', 'Nguyễn Đức Nhật', 'login_success', 'usr_nhatnd_muyjna49', 'Nguyễn Đức Nhật', NULL, '::1', '2026-10-08 03:57:16'),
('log_muyl9e7ojbmltfe5', 'usr_nhatnd_muyjna49', 'Nguyễn Đức Nhật', 'order_status_changed', NULL, 'HD-20261007-001', '{\"order_id\":\"ord_1791406335210_w1inf\",\"action\":\"start_delivery\",\"from\":\"ship_assigned\",\"to\":\"ship_dangiao\"}', '::1', '2026-10-08 03:57:20'),
('log_muyl9lf2fkmocdjw', 'usr_nhatnd_muyjna49', 'Nguyễn Đức Nhật', 'order_status_changed', NULL, 'HD-20261007-001', '{\"order_id\":\"ord_1791406335210_w1inf\",\"action\":\"complete_delivery\",\"from\":\"ship_dangiao\",\"to\":\"ship_done\"}', '::1', '2026-10-08 03:57:29'),
('log_muyla1kvcyodhih', 'usr_nhatnd_muyjna49', 'Nguyễn Đức Nhật', 'order_payment_collected', NULL, 'HD-20261007-001', '{\"order_id\":\"ord_1791406335210_w1inf\",\"amount\":46950000,\"method\":\"cash\"}', '::1', '2026-10-08 03:57:50');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notifications`
--

CREATE TABLE `notifications` (
  `id` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `order_id` varchar(64) DEFAULT NULL,
  `invoice_no` varchar(255) DEFAULT NULL,
  `kind` varchar(64) NOT NULL DEFAULT 'order',
  `title` varchar(255) NOT NULL,
  `message` text DEFAULT NULL,
  `is_read` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `order_id`, `invoice_no`, `kind`, `title`, `message`, `is_read`, `created_at`) VALUES
('ntf_muyl2upy6m5r6k', 'usr_nghitq_muyjico0', 'ord_1791406335210_w1inf', 'HD-20261007-001', 'order_created', 'Đơn mới HD-20261007-001 cần xuất kho', 'Nguyễn Mạnh Tuấn vừa tạo đơn a (47.950.000đ)', 1, '2026-10-08 03:52:15'),
('ntf_muyl4rz0ubxoi9', 'usr_tuannm_muyjjbfc', 'ord_1791406335210_w1inf', 'HD-20261007-001', 'order_exported', 'Kho đã xuất HD-20261007-001', 'Tự động chuyển hàng đợi Kỹ Thuật (theo tag kỹ thuật)', 1, '2026-10-08 03:53:44'),
('ntf_muyl4rz1pcfdtq', 'usr_congdt_muyjli8g', 'ord_1791406335210_w1inf', 'HD-20261007-001', 'order_exported', 'Kho đã xuất HD-20261007-001', 'Tự động chuyển hàng đợi Kỹ Thuật (theo tag kỹ thuật)', 1, '2026-10-08 03:53:44'),
('ntf_muyl6bxozgt04p', 'usr_tuannm_muyjjbfc', 'ord_1791406335210_w1inf', 'HD-20261007-001', 'order_status', 'Kỹ thuật đã xong HD-20261007-001', 'Chuyển sang bộ phận Giao Hàng (kỹ thuật hoàn tất)', 0, '2026-10-08 03:54:57'),
('ntf_muyl6bxpda57fb', 'usr_huynq_muyjm9uj', 'ord_1791406335210_w1inf', 'HD-20261007-001', 'order_status', 'Kỹ thuật đã xong HD-20261007-001', 'Chuyển sang bộ phận Giao Hàng (kỹ thuật hoàn tất)', 1, '2026-10-08 03:54:57'),
('ntf_muyl8g9tc5fc7p', 'usr_tuannm_muyjjbfc', 'ord_1791406335210_w1inf', 'HD-20261007-001', 'order_shipment', 'Bạn được gán giao HD-20261007-001', 'Nguyễn Đức Nhật giao 2.8 km — Toà nhà Bitexco, 2 Hải Triều, Bến Nghé, Quận 1, TP. Hồ Chí Minh', 0, '2026-10-08 03:56:36'),
('ntf_muyl8g9upzpcvs', 'usr_nhatnd_muyjna49', 'ord_1791406335210_w1inf', 'HD-20261007-001', 'order_shipment', 'Bạn được gán giao HD-20261007-001', 'Nguyễn Đức Nhật giao 2.8 km — Toà nhà Bitexco, 2 Hải Triều, Bến Nghé, Quận 1, TP. Hồ Chí Minh', 1, '2026-10-08 03:56:36'),
('ntf_muyl9e7pbjcsd6', 'usr_tuannm_muyjjbfc', 'ord_1791406335210_w1inf', 'HD-20261007-001', 'order_status', 'Đang giao HD-20261007-001', 'Shipper đã nhận hàng từ kho và đang trên đường giao', 0, '2026-10-08 03:57:20'),
('ntf_muyl9lf42qlzcj', 'usr_tuannm_muyjjbfc', 'ord_1791406335210_w1inf', 'HD-20261007-001', 'order_status', 'Đã giao xong HD-20261007-001', 'Đã giao tận tay khách hàng', 0, '2026-10-08 03:57:29'),
('ntf_muyla1kwkyx0td', 'usr_tuannm_muyjjbfc', 'ord_1791406335210_w1inf', 'HD-20261007-001', 'order_payment', 'Đã thu 46.950.000đ (HD-20261007-001)', 'Nguyễn Đức Nhật thu qua tiền mặt', 0, '2026-10-08 03:57:50');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `orders`
--

CREATE TABLE `orders` (
  `id` varchar(64) NOT NULL,
  `invoice_no` varchar(255) NOT NULL,
  `invoice_date` text NOT NULL,
  `customer_name` text NOT NULL,
  `customer_phone` text NOT NULL,
  `customer_address` text DEFAULT NULL,
  `customer_email` text DEFAULT NULL,
  `tags` varchar(1024) NOT NULL DEFAULT '[]',
  `note` text DEFAULT NULL,
  `sales_user_id` varchar(64) NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'draft' CHECK (`status` in ('draft','new','kho_pending','kho_done','kithuat_pending','kithuat_done','baohanh_pending','baohanh_done','ship_pending','ship_assigned','ship_dangiao','ship_done','completed','cancelled')),
  `payment_status` varchar(32) NOT NULL DEFAULT 'unpaid' CHECK (`payment_status` in ('unpaid','partial','full')),
  `related_order_id` varchar(64) DEFAULT NULL,
  `total_amount` int(11) NOT NULL DEFAULT 0,
  `paid_amount` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `orders`
--

INSERT INTO `orders` (`id`, `invoice_no`, `invoice_date`, `customer_name`, `customer_phone`, `customer_address`, `customer_email`, `tags`, `note`, `sales_user_id`, `status`, `payment_status`, `related_order_id`, `total_amount`, `paid_amount`, `created_at`, `updated_at`) VALUES
('ord_1791406335210_w1inf', 'HD-20261007-001', '2026-10-07', 'a', 'a', 'a', NULL, '[\"kithuat\",\"ship\"]', 'a', 'usr_tuannm_muyjjbfc', 'completed', 'full', NULL, 47950000, 47950000, '2026-10-08 03:52:15', '2026-10-08 03:57:50');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_items`
--

CREATE TABLE `order_items` (
  `id` varchar(64) NOT NULL,
  `order_id` varchar(64) NOT NULL,
  `product_id` varchar(64) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` int(11) NOT NULL,
  `warranty_months` int(11) NOT NULL DEFAULT 36 CHECK (`warranty_months` >= 0),
  `serial_number` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price`, `warranty_months`, `serial_number`, `created_at`) VALUES
('item_muyl2upay58p5', 'ord_1791406335210_w1inf', 'prd_c6819585', 1, 12990000, 36, 'CARD-MAN-HINH-GIGABYTE-GEFORCE-RTX-5050-GAMING-OC--SN354864', '2026-10-08 03:52:15'),
('item_muyl2upc9rczn', 'ord_1791406335210_w1inf', 'prd_e1347d53', 1, 10990000, 36, 'CARD-MAN-HINH-INNO3D-GEFORCE-RTX-3060-TWIN-X2-12GB-SN712503', '2026-10-08 03:52:15'),
('item_muyl2upcig56u', 'ord_1791406335210_w1inf', 'prd_0da199de', 3, 7990000, 36, 'CARD-MAN-HINH-ASUS-DUAL-RTX-3050-8GB-V2-SN998638', '2026-10-08 03:52:15');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_status_history`
--

CREATE TABLE `order_status_history` (
  `id` varchar(64) NOT NULL,
  `order_id` varchar(64) NOT NULL,
  `status` varchar(32) NOT NULL,
  `changed_by_user_id` varchar(64) NOT NULL,
  `note` text DEFAULT NULL,
  `snapshot_serials` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `order_status_history`
--

INSERT INTO `order_status_history` (`id`, `order_id`, `status`, `changed_by_user_id`, `note`, `snapshot_serials`, `created_at`) VALUES
('hist_1791406424984_shzej', 'ord_1791406335210_w1inf', 'kho_done', 'usr_nghitq_muyjico0', 'Kho đã kiểm tra linh kiện, quét mã vạch và gắn serial thành công. Serial đã gán: Card màn hình  Gigabyte GeForce RTX 5050 GAMING OC 8G (GV-N5050GAMING OC-8GD): CARD-MAN-HINH-GIGABYTE-GEFORCE-RTX-5050-GAMING-OC--SN354864; Card màn hình  INNO3D GEFORCE RTX 3060 TWIN X2 12GB GDDR6: CARD-MAN-HINH-INNO3D-GEFORCE-RTX-3060-TWIN-X2-12GB-SN712503; Card màn hình Asus DUAL RTX 3050 8GB V2: CARD-MAN-HINH-ASUS-DUAL-RTX-3050-8GB-V2-SN998638', NULL, '2026-10-08 03:53:44'),
('hist_1791406424987_wb8jb', 'ord_1791406335210_w1inf', 'kithuat_pending', 'usr_nghitq_muyjico0', 'Tự động chuyển hàng đợi Kỹ Thuật (theo tag kỹ thuật)', NULL, '2026-10-08 03:53:44'),
('hist_1791406497507_53syb', 'ord_1791406335210_w1inf', 'kithuat_done', 'usr_congdt_muyjli8g', 'Kỹ thuật viên đã kiểm tra linh kiện, lắp ráp hoàn chỉnh và stress test thành công', NULL, '2026-10-08 03:54:57'),
('hist_1791406497513_5mpgc', 'ord_1791406335210_w1inf', 'ship_pending', 'usr_congdt_muyjli8g', 'Chuyển sang bộ phận Giao Hàng (kỹ thuật hoàn tất)', NULL, '2026-10-08 03:54:57'),
('hist_1791406596445_db5dr', 'ord_1791406335210_w1inf', 'ship_assigned', 'usr_huynq_muyjm9uj', 'Quản lý ship phân công shipper Nguyễn Đức Nhật (2.8 km - Google Maps). ', NULL, '2026-10-08 03:56:36'),
('hist_1791406640436_t4fjc', 'ord_1791406335210_w1inf', 'ship_dangiao', 'usr_nhatnd_muyjna49', 'Shipper đã nhận hàng từ kho và đang trên đường giao', NULL, '2026-10-08 03:57:20'),
('hist_1791406649775_aaueu', 'ord_1791406335210_w1inf', 'ship_done', 'usr_nhatnd_muyjna49', 'Đã giao tận tay khách hàng', NULL, '2026-10-08 03:57:29'),
('hist_1791406670718_phia9', 'ord_1791406335210_w1inf', 'completed', 'usr_nhatnd_muyjna49', 'Đơn hàng đã giao xong và khách thanh toán đủ tiền -> Hệ thống tự động chuyển sang Hoàn tất (completed)', NULL, '2026-10-08 03:57:50'),
('hist_muyl2upr3b1w7', 'ord_1791406335210_w1inf', 'kho_pending', 'usr_tuannm_muyjjbfc', 'Kinh doanh tạo đơn hàng mới chuyển kho xuất (Đã cọc 1,000,000đ)', NULL, '2026-10-08 03:52:15'),
('hist_muyla1ktjbngp', 'ord_1791406335210_w1inf', 'ship_done', 'usr_nhatnd_muyjna49', 'Thu 46,950,000đ qua Tiền mặt. Trạng thái thanh toán: Đã đủ 100%. ', NULL, '2026-10-08 03:57:50');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payments`
--

CREATE TABLE `payments` (
  `id` varchar(64) NOT NULL,
  `order_id` varchar(64) NOT NULL,
  `method` varchar(32) NOT NULL CHECK (`method` in ('qr','cash','transfer')),
  `amount` int(11) NOT NULL,
  `collected_by_user_id` varchar(64) NOT NULL,
  `paid_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `payments`
--

INSERT INTO `payments` (`id`, `order_id`, `method`, `amount`, `collected_by_user_id`, `paid_at`) VALUES
('pay_muyl2updg0d0t', 'ord_1791406335210_w1inf', 'qr', 1000000, 'usr_tuannm_muyjjbfc', '2026-10-08 03:52:15'),
('pay_muyla1kpond70', 'ord_1791406335210_w1inf', 'cash', 46950000, 'usr_nhatnd_muyjna49', '2026-10-08 03:57:50');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `products`
--

CREATE TABLE `products` (
  `id` varchar(64) NOT NULL,
  `sku` varchar(255) NOT NULL,
  `name` text NOT NULL,
  `unit_price` int(11) NOT NULL,
  `stock_qty` int(11) NOT NULL DEFAULT 0,
  `category` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `products`
--

INSERT INTO `products` (`id`, `sku`, `name`, `unit_price`, `stock_qty`, `category`, `created_at`) VALUES
('prd_005a5c75', 'CPU-INTEL-CORE-I7-12700KF-TRAY', 'CPU Intel Core i7-12700KF - TRAY NEW (3.8GHz turbo up to 5.0Ghz, 12 nhân 20 luồng, 20MB Cache, 125W) - Socket Intel LGA 1700/Alder Lake)', 6990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_00be8c62', 'CPU-AMD-RYZEN-9-9900X', 'CPU AMD Ryzen 9 9900X  (4.4 GHz Boost 5.6 GHz | 12 nhân / 24 luồng| 64 MB Cache)', 11890000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_00c3adfb', 'O-CUNG-SSD-ADATA-LEGEND-860-2TB-NVME-PCIE-GEN4-X4-', 'Ổ cứng SSD ADATA LEGEND 860 2TB NVMe PCIe Gen4 x4 M.2 2280 (SLEG-860-2000GCS)', 5690000, 10, 'SSD', '2026-10-08 02:53:42'),
('prd_0127b090', 'CPU-INTEL-CORE-ULTRA-5-245KF', 'CPU Intel Core Ultra 5 245KF (Up to 5.2GHz , 14 nhân - 14 luồng ,24MB Cache, Arrow Lake -S)', 8999000, 10, 'CPU', '2026-10-08 02:50:38'),
('prd_01726f38', 'MAINBOARD-GIGABYTE-B860M-AORUS-PRO-WIFI7-DDR5', 'Mainboard Gigabyte B860M AORUS PRO WIFI7 DDR5', 6899000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_01cde96f', 'MAN-HINH-GAMING-SAMSUNG-ODYSSEY-OLED-G9-G93SD-LS49', 'Màn hình Gaming SAMSUNG Odyssey OLED G9 G93SD LS49DG930SEXXV (49 inch - OLED - DQHD - 240Hz - 0.03ms - Cong)', 29780000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_01ecdb04', 'MAINBOARD-ASUS-ROG-STRIX-B850-A-GAMING-WIFI', 'Mainboard ASUS ROG STRIX B850-A GAMING WIFI', 8599000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_026543e7', 'MAN-HINH-DELL-SE2426H', 'Màn Hình Dell SE2426H (23.8 inch - IPS - FHD - 144Hz - 1ms)', 2790000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_0374e685', 'MAINBOARD-ASUS-ROG-STRIX-X870-F-GAMING-WIFI', 'Mainboard ASUS ROG STRIX X870-F GAMING WIFI', 13980000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_039bd89e', 'MAN-HINH-GAMING-SAMSUNG-ODYSSEY-OLED-G8-G81SF-LS32', 'Màn Hình Gaming SAMSUNG Odyssey OLED G8 G81SF LS32FG812SEXXV (32 inch - OLED - 4K - 240Hz - 0,03ms)', 26480000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_050021e3', 'MAN-HINH-GAMING-SAMSUNG-ODYSSEY-G5-G50F-LS27FG502E', 'Màn Hình Gaming SAMSUNG Odyssey G5 G50F LS27FG502EEXXV (27 inch - IPS - 2K - 180Hz - 1ms)', 4790000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_059d64bb', 'MAN-HINH-DELL-G2723H-27-INCH-280HZ-FULL-HD-FAST-IP', 'MÀN HÌNH DELL G2723H 27 INCH - 280HZ- FULL HD - FAST IPS LED GAMING MONITOR', 4980000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_05de2aca', 'MAN-HINH-AOC-24G50Z-23-8-INCH-IPS-FHD-260HZ-0-3MS', 'Màn Hình AOC 24G50Z (23.8 inch - IPS - FHD - 260Hz - 0.3ms)', 2690000, 10, 'Màn hình', '2026-10-08 02:50:38'),
('prd_05f3a803', 'MAN-HINH-GAMING-LG-ULTRAGEAR-27GX790A-B', 'Màn Hình Gaming LG UltraGear 27GX790A-B (26.5 inch - OLED - 2K - 480Hz - 0.03ms)', 19990000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_06799950', 'MAINBOARD-GIGABYTE-B860M-AORUS-ELITE-WIFI-6E-ICE-D', 'Mainboard Gigabyte B860M AORUS ELITE WIFI 6E ICE DDR5', 6199000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_06efde51', 'TAN-NHIET-NUOC-GAMDIAS-CHIONE-P5-360-ARGB-BLACK', 'Tản nhiệt nước Gamdias CHIONE P5-360 ARGB BLACK (WCCNEP5360BLGA)', 3890000, 10, 'Tản nhiệt', '2026-10-08 02:54:09'),
('prd_06feea06', 'MAINBOARD-MSI-MPG-Z890-CARBON-WIFI-DDR5', 'Mainboard MSI MPG Z890 CARBON WIFI DDR5', 14999000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_088cca54', 'NGUON-MAY-TINH-SUPER-FLOWER-LEADEX-VII-PLATINUM-PR', 'Nguồn máy tính Super Flower LEADEX VII Platinum PRO 1200W ATX 3.1 | 80 Plus Platinum (SF-1200F14XP)', 5990000, 10, 'PSU', '2026-10-08 02:50:38'),
('prd_09260761', 'MAINBOARD-ASROCK-X870-PRO-RS-DDR5', 'Mainboard Asrock X870 Pro RS DDR5', 7390000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_098f4a2b', 'CPU-INTEL-CORE-I7-14700K-TRAY', 'CPU Intel Core I7-14700K ( Up to 5.6Ghz, 20 nhân/ 28 Luồng,  33MB Cache )- TRAY', 10590000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_0b99f57f', 'MAN-HINH-LG-27U411B-B', 'Màn Hình LG 27U411B-B (27 inch - FHD - IPS - 144Hz - HDR10)', 2890000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_0ca4017a', 'MAINBOARD-ASUS-TUF-GAMING-B650M-E-DDR5', 'Mainboard ASUS TUF GAMING B650M-E DDR5', 3490000, 10, 'Mainboard', '2026-10-08 02:50:38'),
('prd_0d7cf62c', 'O-CUNG-HDD-WD-2TB-BLUE-3-5-INCH-5400RPM-SATA-III-6', 'Ổ Cứng HDD WD 2TB Blue 3.5 inch, 5400RPM, SATA III, 64MB Cache (WD20EARZ)', 3990000, 10, 'HDD', '2026-10-08 02:50:38'),
('prd_0da199de', 'CARD-MAN-HINH-ASUS-DUAL-RTX-3050-8GB-V2', 'Card màn hình Asus DUAL RTX 3050 8GB V2', 7990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_0e187f64', 'MAN-HINH-GAMING-LG-ULTRAGEAR-32GX870A-B', 'Màn Hình Gaming LG UltraGear 32GX870A-B (31.5 inch - OLED - 4K - 240Hz/FHD - 480Hz- 0.03ms - Speaker - USB TypeC )', 26990000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_0e4a6995', 'MAN-HINH-SAMSUNG-ODYSSEY-G5-G50SF-LS27FG502SEXXV', 'Màn Hình SAMSUNG Odyssey G5 G50SF LS27FG502SEXXV (27 inch - OLED - 2K - 0.03ms - 180Hz)', 11980000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_0e656122', 'MAINBOARD-ASUS-PRIME-B550M-A', 'Mainboard ASUS PRIME B550M-A (AMD B550, Socket AM4,m- ATX, 4 khe RAM DRR4)', 2350000, 10, 'Mainboard', '2026-10-08 02:50:38'),
('prd_0eb04bf1', 'CPU-AMD-RYZEN-7-7700-3-8-GHZ-UPTO-5-3GHZ-40MB-8-CO', 'CPU AMD Ryzen 7 7700 (3.8 GHz Upto 5.3GHz / 40MB / 8 Cores, 16 Threads / 65W / Socket AM5)', 8990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_0eb143e6', 'NGUON-MAY-TINH-FSP-VIC-WD-650-650W-80-PLUS-WHITE', 'Nguồn máy tính FSP VIC WD 650 650W 80 Plus White', 1190000, 10, 'PSU', '2026-10-08 02:54:09'),
('prd_10b6eb08', 'MAN-HINH-ASUS-VA279HG-27-INCH-IPS-FHD-120HZ-1MS', 'Màn Hình ASUS VA279HG (27 inch - IPS - FHD - 120Hz - 1ms)', 2690000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_10cae978', 'MAN-HINH-GAMING-LG-ULTRAGEAR-34GX90SA-W-34-INCH-OL', 'Màn Hình Gaming LG UltraGear 34GX90SA-W (34 Inch/ OLED/ WQHD/ 240Hz/ 0.03ms/webOS/cong)', 24490000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_10f61be0', 'CPU-INTEL-CORE-I5-14600K-TRAY', 'CPU Intel Core i5-14600K ( Up to 5.3GHz ,14 Nhân 20 Luồng ,24MB ) - TRAY', 6990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_111af402', 'MAN-HINH-GAMING-SAMSUNG-ODYSSEY-OLED-G8-G80SH-LS27', 'Màn Hình Gaming SAMSUNG Odyssey OLED G8 G80SH LS27HG802SEXXV (27 inch - OLED - 4K - 240Hz - 0.03ms)', 25880000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_115ef846', 'RAM-PATRIOT-EP-VIPER-VENOM-16GB-DDR5-6000MHZ', 'RAM Patriot EP Viper Venom 16GB DDR5 6000MHz', 6990000, 10, 'RAM', '2026-10-08 02:50:38'),
('prd_126893ab', 'MAN-HINH-DELL-ULTRASHARP-U3225QE', 'Màn Hình Dell UltraSharp U3225QE (31.5 inch - IPS - 4K - 120Hz - 5ms)', 22390000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_130028d3', 'CARD-MAN-HINH-MSI-RTX-5050-8GB-SHADOW-2X-OC', 'Card màn hình MSI RTX 5050 8GB Shadow 2X OC', 10990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_1303d5fe', 'MAINBOARD-ASUS-TUF-GAMING-B650M-E-WIFI-DDR5', 'Mainboard ASUS TUF GAMING B650M-E WIFI DDR5', 3990000, 10, 'Mainboard', '2026-10-08 02:50:38'),
('prd_133655fe', 'MAN-HINH-DELL-SE2725HG', 'Màn Hình Dell SE2725HG (27 inch - IPS - FHD - 200Hz - 1ms)', 3590000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_13c4cb11', 'TAN-NHIET-KHI-TRYX-TURRIS-620-BLACK', 'Tản nhiệt khí TRYX TURRIS 620 BLACK', 4390000, 10, 'Tản nhiệt', '2026-10-08 02:54:09'),
('prd_14027720', 'O-CUNG-SSD-HIKSEMI-HS-SSD-WAVE-S-512G', 'Ổ cứng SSD HIKSEMI HS-SSD-WAVE(S) 512G (SATA3/ 2.5Inch/ 530MB/s/ 450MB/s)', 1890000, 10, 'SSD', '2026-10-08 02:50:38'),
('prd_14adab4e', 'MAN-HINH-DELL-S2425HSM', 'Màn Hình Dell S2425HSM (23.8 inch - IPS - FHD - 144Hz - 1ms - Speaker)', 3690000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_15528b10', 'CARD-MAN-HINH-ASUS-ROG-ASTRAL-RTX-5090-32G-GAMING-', 'Card màn hình ASUS ROG ASTRAL RTX 5090 32GB GAMING WHITE OC', 189990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_156f7ea4', 'CARD-MAN-HINH-MSI-GEFORCE-RTX-5090-32G-GAMING-TRIO', 'Card màn hình MSI GeForce RTX 5090 32GB GAMING TRIO OC', 189990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_15f06b09', 'MAINBOARD-GIGABYTE-B760M-GAMING-WIFI-PLUS-DDR5', 'Mainboard Gigabyte B760M GAMING WIFI PLUS DDR5', 3899000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_1677ba71', 'MAN-HINH-LG-ULTRAFINE-27U711B-B', 'Màn Hình LG UltraFine 27U711B-B (27 inch - IPS - 4K - 60Hz - 5ms)', 5390000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_16e05f6a', 'RAM-CRUCIAL-PRO-OC-GAMING-32GB-2X16GB-DDR5-6400MHZ', 'RAM CRUCIAL PRO OC GAMING 32GB (2X16GB) DDR5 6400MHZ C38 (CP2K16G64C38U5B)', 13990000, 10, 'RAM', '2026-10-08 02:53:41'),
('prd_17020fdb', 'MAINBOARD-COLORFUL-BATTLE-AX-B650M-PLUS-WIFI-V15', 'Mainboard Colorful BATTLE-AX B650M-PLUS WIFI V15', 3290000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_172f2750', 'CPU-AMD-RYZEN-7-7800X3D-TRAY', 'CPU AMD RYZEN 7 7800X3D (4.2GHZ UP TO 5.0GHZ/105MB/8 CORES 16 THREADS/120W/SOCKET AM5)- TRAY', 8890000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_17d13a8f', 'O-CUNG-WESTERN-DIGITAL-CAVIAR-BLUE-4TB-256MB-CACHE', 'Ổ cứng Western Digital Caviar Blue 4TB 256MB Cache 5400RPM WD40EZZX', 5290000, 10, 'HDD', '2026-10-08 02:50:38'),
('prd_18c1a42e', 'MAINBOARD-MSI-B650M-A-WIFI-DDR5', 'Mainboard MSI B650M-A WIFI DDR5', 5199000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_19143922', 'CPU-INTEL-CORE-ULTRA-5-245KF-TRAY', 'CPU Intel Core Ultra 5 245KF (Up to 5.2GHz , 14 nhân - 14 luồng ,24MB Cache, Arrow Lake -S)-TRAY', 5390000, 10, 'CPU', '2026-10-08 02:50:38'),
('prd_192d7118', 'CARD-MAN-HINH-GIGABYTE-GEFORCE-RTX-5060-WINDFORCE-', 'Card màn hình Gigabyte GeForce RTX 5060 WINDFORCE OC 8GB (GV-N5060WF2OC-8GD)', 14990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_1ae94b4e', 'MAINBOARD-GIGABYTE-B860M-EAGLE-PLUS-WIFI-6E-DDR5', 'Mainboard Gigabyte B860M EAGLE PLUS WIFI 6E DDR5', 4999000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_1bb8a7c3', 'MAN-HINH-SAMSUNG-ODYSSEY-G3-G30D-LS27DG302EEXXV', 'Màn Hình SAMSUNG Odyssey G3 G30D LS27DG302EEXXV (27 inch - VA - FHD - 180Hz - 1ms)', 3290000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_1c27b8c5', 'CARD-MAN-HINH-ASUS-ROG-ASTRAL-GEFORCE-RTX-5080-16G', 'Card màn hình ASUS ROG Astral GeForce RTX 5080 16GB GDDR7 OC Edition', 69990000, 10, 'VGA', '2026-10-08 02:50:38'),
('prd_1c9ad053', 'CARD-MAN-HINH-COLORFUL-GEFORCE-RTX-5060-GAMING-DUO', 'Card Màn Hình Colorful GeForce RTX 5060 Gaming DUO 8GB-V', 14990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_1e201ec8', 'CARD-MAN-HINH-MSI-GEFORCE-RTX-5060-TI-16G-VENTUS-2', 'Card màn hình MSI GeForce RTX 5060 Ti 16G VENTUS 2X OC PLUS', 22990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_1e7c2eaf', 'O-CUNG-SSD-WD-GREEN-SN3000-500GB-M-2-2280-NVME-PCI', 'Ổ cứng SSD WD GREEN SN3000 500GB M.2 2280 NVMe PCIe Gen 4x4', 3390000, 10, 'SSD', '2026-10-08 02:53:42'),
('prd_1e8a59b7', 'MAINBOARD-GIGABYTE-B850M-AORUS-ELITE-WIFI-6E-DDR5', 'Mainboard Gigabyte B850M AORUS ELITE WIFI 6E DDR5', 5990000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_22265176', 'NGUON-MAY-TINH-FSP-VIC-BD-750-750W-80-PLUS-BRONZE', 'Nguồn máy tính FSP VIC BD 750 750W 80 Plus Bronze', 1590000, 10, 'PSU', '2026-10-08 02:54:09'),
('prd_227f84b5', 'MAINBOARD-ASUS-TUF-GAMING-Z890-PLUS-WIFI', 'Mainboard  ASUS TUF Gaming Z890-PLUS WIFI DDR5', 7190000, 10, 'Mainboard', '2026-10-08 02:50:38'),
('prd_234ecd9c', 'MAN-HINH-ASUS-PROART-PA249CGV', 'Màn Hình ASUS ProArt PA249CGV (23.8 inch - IPS - FHD - 144Hz - 5ms - Speaker)', 5390000, 10, 'Màn hình', '2026-10-08 02:54:10'),
('prd_23560d22', 'MAINBOARD-ASUS-PRIME-B760M-F-DDR4', 'Mainboard Asus PRIME B760M-F DDR4', 2490000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_24a0b230', 'MAINBOARD-ASUS-PRIME-B650M-A-WIFI-CSM', 'Mainboard ASUS PRIME B650M-A WIFI-CSM', 4499000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_25057518', 'CARD-MAN-HINH-INNO3D-GEFORCE-RTX-5060-TI-8GB-TWIN-', 'Card màn hình INNO3D GeForce RTX 5060 Ti 8GB Twin X2 OC', 15990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_25565f0a', 'RAM-TEAMGROUP-T-FORCE-DELTA-RGB-16GB-DDR5-6000MHZ-', 'RAM TeamGroup T-Force Delta RGB 16GB DDR5 6000Mhz (FF3D516G6000HC38J01)', 6990000, 10, 'RAM', '2026-10-08 02:50:38'),
('prd_2592d59a', 'NGUON-MAY-TINH-ASUS-PRIME-750B', 'Nguồn máy tính ASUS PRIME 750B (750W, 80 Plus Bronze, Non-modular, 6 năm bảo hành)', 1690000, 10, 'PSU', '2026-10-08 02:54:09'),
('prd_25e012b1', 'CPU-INTEL-CORE-I3-12100-TRAY', 'CPU Intel Core i3-12100 - TRAY (3.3GHz turbo up to 4.3GHz, 4 nhân 8 luồng, 12MB Cache, 58W)- Socket Intel LGA 1700', 3990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_25fe4cb1', 'MAN-HINH-DELL-PLUS-P2725H-27-INCH-FHD-IPS-100HZ-5M', 'Màn hình Dell Plus P2725H (27 inch/FHD/IPS/100Hz/5ms/USB-C 15W)', 5599000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_27136cc4', 'MAN-HINH-GAMING-SAMSUNG-ODYSSEY-G6-G61SH-LS27HG612', 'Màn Hình Gaming SAMSUNG Odyssey G6 G61SH LS27HG612SEXXV (27 inch - OLED - 2K - 240Hz - 0.03ms)', 13780000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_271ee0db', 'CPU-INTEL-CORE-I9-14900KF-TRAY', 'CPU INTEL CORE I9-14900KF - Tray (UP TO 5.8GHZ, 24 NHÂN 32 LUỒNG, 36MB CACHE, 125W,RAPTOR LAKE  REFRESH)', 11990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_27f0af57', 'TAN-NHIET-CPU-ID-COOLING-SE-214-XT-ARGB', 'TẢN NHIỆT CPU ID-COOLING SE-214-XT ARGB', 500000, 10, 'Tản nhiệt', '2026-10-08 02:54:09'),
('prd_280a4ea4', 'RAM-PNY-XLR8-GAMING-16GB-1X16GB-DDR4-3200MHZ', 'Ram PNY XLR8 Gaming 16GB (1x16GB) DDR4 3200MHz', 2890000, 10, 'RAM', '2026-10-08 02:50:38'),
('prd_2854f1f7', 'MAINBOARD-ASUS-TUF-GAMING-B650M-PLUS-WIFI', 'Mainboard ASUS TUF GAMING B650M-PLUS WIFI DDR5', 4590000, 10, 'Mainboard', '2026-10-08 02:50:38'),
('prd_28566cdf', 'MAN-HINH-GAMING-SAMSUNG-ODYSSEY-G5-G55C-LS32CG552E', 'Màn Hình Gaming SAMSUNG Odyssey G5 G55C LS32CG552EEXXV (32.0 inch - 2K - VA - 165Hz - 1ms - FreeSync - HDR10 - Curved)', 5590000, 10, 'Màn hình', '2026-10-08 02:54:10'),
('prd_28b13138', 'VO-CASE-THERMALRIGHT-TL-M10-VISION-BLACK', 'Vỏ case Thermalright TL-M10 Vision BLACK ( M-ATX có màn hình 9.2 inch )', 2690000, 10, 'Case', '2026-10-08 02:50:38'),
('prd_28fac63a', 'VO-CASE-GAMDIAS-AURA-GC15-ARGB-CAAURAGC15BLGA', 'VỎ CASE GAMDIAS AURA GC15 ARGB CAAURAGC15BLGA (MID TOWER, BLACK)', 950000, 10, 'Case', '2026-10-08 02:50:38'),
('prd_2931c558', 'RAM-G-SKILL-RIPJAWS-S5-32GB-2X16GB-DDR5-6000MHZ-F5', 'RAM G.Skill Ripjaws S5 32GB (2x16GB) DDR5 6000MHz (F5-6000J3636F16GX2-RS5K)', 13990000, 10, 'RAM', '2026-10-08 02:53:41'),
('prd_297b1652', 'MAN-HINH-GAMING-EDRA-EGM25F200H', 'Màn Hình Gaming EDRA EGM25F200H (25 inch - IPS - FHD - 200Hz - 1ms)', 2590000, 10, 'Màn hình', '2026-10-08 02:54:10'),
('prd_29abb6d3', 'CARD-MAN-HINH-ZOTAC-GAMING-GEFORCE-RTX-5060-AMP', 'Card màn hình ZOTAC GAMING GeForce RTX 5060  8GB AMP', 14990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_2a002af2', 'CARD-MAN-HINH-GIGABYTE-AORUS-GEFORCE-RTX-5090-XTRE', 'Card màn hình GIGABYTE AORUS GeForce RTX 5090 XTREME WATERFORCE WB 32GB GDDR7', 199000000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_2a3c1179', 'CARD-MAN-HINH-ZOTAC-GAMING-GEFORCE-RTX-5060-TI-8GB', 'Card màn hình ZOTAC GAMING GeForce RTX 5060 Ti 8GB Twin Edge', 15990000, 10, 'VGA', '2026-10-08 02:50:38'),
('prd_2aae3888', 'TAN-NHIET-NUOC-AIO-JUNGLE-LEOPARD-CHILL-ARC-360-MA', 'Tản Nhiệt Nước AIO Jungle Leopard Chill Arc 360 (Màu Đen, Màn Hình Cong)', 4990000, 10, 'Tản nhiệt', '2026-10-08 02:50:38'),
('prd_2af148ab', 'MAINBOARD-ASUS-ROG-STRIX-X870E-H-GAMING-WIFI-7-HAT', 'Mainboard ASUS ROG STRIX X870E-H GAMING WIFI 7 Hatsune Miku Edition', 14890000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_2b6a1312', 'CPU-AMD-RYZEN-RYZEN-5-7500F-TRAY', 'CPU AMD Ryzen Ryzen 5 7500F - TRAY NEW (3.7 GHz Upto 5.0GHz / 38MB / 6 Cores, 12 Threads / 65W / Socket AM5)', 3980000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_2bf10fb0', 'MAN-HINH-GAMING-ASUS-TUF-GAMING-VG249QE5A-R-24-INC', 'Màn Hình Gaming Asus TUF GAMING VG249QE5A-R  (24 inch ,IPS ,146Hz, 1ms)', 2590000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_2c049b10', 'MAINBOARD-ASUS-TUF-GAMING-X870-PLUS-WIFI-DDR5', 'Mainboard Asus TUF GAMING X870-PLUS WIFI DDR5', 9690000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_2c2b7c71', 'CARD-MAN-HINH-COLORFUL-GEFORCE-RTX-3050-6GB-V', 'Card màn hình Colorful GeForce RTX 3050 6GB-V', 5890000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_2d7af120', 'MAN-HINH-GAMING-LG-ULTRAGEAR-39GX90SA-W', 'Màn Hình Gaming LG UltraGear 39GX90SA-W (39 inch - OLED - WQHD - 240Hz - 0.03ms - Speaker)', 32990000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_2da8df03', 'TAN-NHIET-KHI-TRYX-TURRIS-620-WHITE', 'Tản nhiệt khí TRYX TURRIS 620 WHITE', 4390000, 10, 'Tản nhiệt', '2026-10-08 02:54:09'),
('prd_2db6eb72', 'CPU-AMD-RYZEN-7-7700-TRAY', 'CPU AMD Ryzen 7 7700 - TRAY NEW (3.8 GHz Upto 5.3GHz / 40MB / 8 Cores, 16 Threads / 65W / Socket AM5) ( TRAY)', 5990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_2e346eea', 'VO-CASE-XIGMATEK-MOON-ML-DGT-3AF-BLACK', 'Vỏ Case Xigmatek Moon ML DGT 3AF', 1090000, 10, 'Case', '2026-10-08 02:50:38'),
('prd_2e705f6f', 'CARD-MAN-HINH-COLORFUL-GEFORCE-RTX-3060-BATTLE-AX-', 'Card Màn Hình Colorful GeForce RTX 3060 Battle AX DUO 12GB V2-V', 10990000, 10, 'VGA', '2026-10-08 02:50:38'),
('prd_2ea7e9cb', 'CARD-MAN-HINH-ASUS-ROG-ASTRAL-GEFORCE-RTX-5090-EDI', 'Card màn hình Asus ROG Astral GeForce RTX 5090 Edition 20', 269990000, 10, 'VGA', '2026-10-08 02:50:38'),
('prd_30260a3e', 'MAINBOARD-SAPPHIRE-NITRO-B850M-WIFI-DDR5', 'Mainboard Sapphire NITRO+ B850M WIFI DDR5', 4890000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_305a7f6c', 'MAINBOARD-ASUS-B860M-AYW-GAMING-WIFI', 'Mainboard ASUS B860M AYW GAMING WIFI', 5199000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_30749c31', 'NGUON-MAY-TINH-AIGO-CK650-PRO-80-EFICIENCY-650W-CA', 'NGUỒN MÁY TÍNH AIGO CK650 PRO 80+ EFICIENCY - 650W (CÁP DẸT)', 920000, 10, 'PSU', '2026-10-08 02:54:09'),
('prd_30a1de33', 'MAINBOARD-GIGABYTE-Z890-AORUS-ELITE-WIFI7-ICE-DDR5', 'Mainboard Gigabyte Z890 AORUS ELITE WIFI7 ICE DDR5', 9899000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_313fe8e5', 'MAINBOARD-ASUS-ROG-MAXIMUS-Z890-APEX', 'Mainboard ASUS ROG MAXIMUS Z890 APEX', 20299000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_3196937a', 'CPU-INTEL-CORE-ULTRA-5-245K-TRAY', 'CPU Intel Core Ultra 5 245K  (Up to 5.2GHz , 14 nhân - 14 luồng ,24MB Cache, Arrow Lake -S) - TRAY', 7290000, 10, 'CPU', '2026-10-08 02:50:38'),
('prd_321d6b08', 'VO-CASE-GAMDIAS-AURA-GC15-ARGB-CAAURAGC15WHGA', 'Copy VỎ CASE GAMDIAS AURA GC15 ARGB CAAURAGC15WHGA (MID TOWER, WHITE)', 1050000, 10, 'Case', '2026-10-08 02:50:38'),
('prd_328aaf27', 'MAN-HINH-GAMING-LG-ULTRAGEAR-G4-27G440A-B', 'Màn Hình Gaming LG UltraGear G4 27G440A-B (27 inch - IPS - FHD - 240Hz - 1ms)', 3790000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_3403b73a', 'CPU-AMD-RYZEN-9-9950X', 'CPU AMD Ryzen 9 9950X (16 nhân 32 luồng, up to 5.7GHz, 80MB Cache)', 16699000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_341d137d', 'MAINBOARD-GIGABYTE-B850-AORUS-ELITE-WIFI-7-ICE', 'Mainboard Gigabyte B850 AORUS Elite WiFi 7 ICE', 7890000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_34e4c0b2', 'MAINBOARD-PRO-MSI-A620M-E-DDR5', 'Mainboard PRO MSI A620M-E DDR5', 2590000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_35829e44', 'MAINBOARD-GIGABYTE-X870E-AORUS-ELITE-WIFI7', 'Mainboard GIGABYTE X870E AORUS ELITE WIFI7', 9890000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_35c4b7d8', 'MAN-HINH-GAMING-SAMSUNG-ODYSSEY-OLED-G8-G80SH-LS32', 'Màn Hình Gaming SAMSUNG Odyssey OLED G8 G80SH LS32HG802SEXXV (32 inch - OLED - 4K - 240Hz - 0.03ms)', 32880000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_35f36857', 'CPU-INTEL-CORE-I3-10105-TRAY', 'CPU Intel Core i3-10105 - Tray (3.7GHz turbo up to 4.4Ghz, 4 nhân 8 luồng, 6MB Cache, 65W) - Socket Intel LGA 1200', 3590000, 10, 'CPU', '2026-10-08 02:50:38'),
('prd_366e5ee8', 'CPU-AMD-RYZEN-9-7950X3D-4-2GHZ-UP-TO-5-7GHZ-144MB-', 'CPU AMD Ryzen 9 7950X3D (4.2Ghz up to 5.7Ghz/ 144MB/ 16 cores 32 threads/ 120W/ Sockets AM5)', 17199000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_36a7bdf4', 'CPU-AMD-RYZEN-5-5600X-TRAY', 'CPU AMD Ryzen 5 5600X - TRAY (3.7 GHz Upto 4.6GHz / 35MB / 6 Cores, 12 Threads / 65W / Socket AM4)', 3790000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_36b7f57b', 'MAINBOARD-MSI-B760M-GAMING-WIFI-DDR5-2-KHE-RAM', 'Mainboard MSI B760M GAMING WIFI DDR5 ( 2 Khe RAM)', 3290000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_36bf9179', 'MAINBOARD-ASROCK-Z890-STEEL-LEGEND-WIFI-DDR5', 'Mainboard ASROCK Z890 STEEL LEGEND WIFI DDR5', 9399000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_36df16a6', 'MAINBOARD-ASUS-ROG-STRIX-X870-I-GAMING-WIFI', 'Mainboard Asus ROG STRIX X870-I GAMING WIFI', 13490000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_37013772', 'CARD-MAN-HINH-ZOTAC-GAMING-GEFORCE-RTX-5060-SOLO', 'Card màn hình ZOTAC GAMING GeForce RTX 5060 8GB SOLO', 14990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_370a32da', 'CPU-AMD-RYZEN-5-9600X', 'CPU AMD Ryzen 5 9600X (3.9 GHz Boost 5.4 GHz | 6 nhân/ 12 luồng | 32 MB Cache)', 8099000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_370c7016', 'CARD-MAN-HINH-ASUS-DUAL-GEFORCE-RTX-5060-8GB-GDDR7', 'Card màn hình ASUS Dual GeForce RTX 5060 8GB GDDR7 OC Edition (DUAL-RTX5060-O8G)', 14990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_376089ec', 'MAINBOARD-GIGABYTE-B850M-AORUS-ELITE-WIFI7-ICE-P', 'Mainboard GIGABYTE B850M AORUS ELITE WIFI7 ICE-P', 5990000, 10, 'Mainboard', '2026-10-08 02:50:38'),
('prd_37de4f2b', 'CARD-MAN-HINH-GIGABYTE-GEFORCE-RTX-5090-GAMING-OC-', 'Card màn hình GIGABYTE GeForce RTX 5090 GAMING OC 32GB GDDR7', 189990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_380eccd2', 'CARD-MAN-HINH-GIGABYTE-RTX-3050-6GB-WINFORCE-OC-V2', 'Card màn hình Gigabyte RTX 3050 6GB WINFORCE OC V2', 5990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_38503458', 'MAN-HINH-DO-HOA-ASUS-PROART-PA248QFV', 'Màn Hình Đồ Họa ASUS ProArt PA248QFV (24.1 inch - IPS - WUXGA - 100Hz - 5ms - Speaker)', 4890000, 10, 'Màn hình', '2026-10-08 02:50:38'),
('prd_385b0afa', 'MAN-HINH-DELL-27-SE2726H', 'Màn Hình Dell 27 SE2726H (27 inch - IPS - FHD - 144Hz - 1ms)', 3590000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_38f3818a', 'MAN-HINH-GAMING-LG-ULTRAGEAR-27G523B-B', 'Màn Hình Gaming LG UltraGear 27G523B-B (27 inch - IPS - FHD - 200Hz - 1ms)', 3590000, 10, 'Màn hình', '2026-10-08 02:50:38'),
('prd_3967b066', 'VO-CASE-XIGMATEK-MOON-ML-DGT-ARCTIC', 'Vỏ Case Xigmatek Moon ML DGT Arctic', 1090000, 10, 'Case', '2026-10-08 02:50:38'),
('prd_3974ff38', 'RAM-SAMSUNG-16GB-DDR4-2133MHZ-ECC-REGISTERED', 'RAM Samsung 16GB DDR4 2133MHz ECC Registered', 1890000, 10, 'RAM', '2026-10-08 02:53:41'),
('prd_3985ba1e', 'CARD-MAN-HINH-IGAME-GEFORCE-RTX-5080-ULTRA-W-OC-16', 'Card Màn Hình Colorful IGame GeForce RTX 5080 Ultra W OC 16GB GDDR7', 47990000, 10, 'VGA', '2026-10-08 02:50:38'),
('prd_39abc5bd', 'O-CUNG-SSD-HIKSEMI-HS-SSD-WAVE-S-256G', 'Ổ cứng SSD HIKSEMI HS-SSD-WAVE(S) 256G (SATA3/ 2.5Inch/ 530MB/s/ 400MB/s)', 1190000, 10, 'SSD', '2026-10-08 02:50:38'),
('prd_39cdcaae', 'RAM-KINGSPEC-16GB-BUS-3200MHZ-DDR4-TAN-NHIET-DEN', 'RAM Kingspec 16GB Bus 3200MHz DDR4  Tản Nhiệt Đen', 2890000, 10, 'RAM', '2026-10-08 02:50:38'),
('prd_3e800ecf', 'MAINBOARD-ASUS-TUF-GAMING-B850M-PLUS', 'Mainboard ASUS TUF GAMING B850M-PLUS', 6699000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_405e09a6', 'CPU-INTEL-CORE-I5-10400F-TRAY', 'CPU Intel Core i5-10400F - TRAY NEW (3.4GHz turbo up to 4.4Ghz, 6 nhân 12 luồng, 12MB Cache, 65W)', 2990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_424063b1', 'MAINBOARD-ASUS-PRIME-B860M-K-CSM', 'Mainboard ASUS PRIME B860M-K-CSM', 4699000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_42e59806', 'NGUON-MAY-TINH-GAMDIAS-AURA-GP750-750W-80-PLUS-WHI', 'Nguồn máy tính Gamdias AURA GP750 750W - 80 PLUS White', 1050000, 10, 'PSU', '2026-10-08 02:50:38'),
('prd_42e8404d', 'VO-CASE-THERMALRIGHT-TL-M10-VISION-WHITE', 'Vỏ case Thermalright TL-M10 Vision White ( M-ATX có màn hình 9.2 inch )', 2690000, 10, 'Case', '2026-10-08 02:50:38'),
('prd_43dd27e1', 'CARD-MAN-HINH-MSI-GEFORCE-RTX-5070-TI-GAMING-TRIO-', 'Card màn hình MSI GeForce RTX 5070 Ti GAMING TRIO OC 16GB GDDR7', 40990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_43eab64e', 'MAINBOARD-ASUS-PROART-Z890-CREATOR-WIFI', 'Mainboard ASUS ProArt Z890-CREATOR WIFI', 14799000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_44951bc9', 'MAINBOARD-GIGABYTE-B860M-EAGLE-WIFI6-DDR5', 'Mainboard Gigabyte B860M EAGLE WIFI6 DDR5', 4199000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_44fe4158', 'MAINBOARD-ASUS-ROG-B650E-F-GAMING-WIFI', 'Mainboard ASUS ROG B650E-F GAMING WIFI', 7899000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_4509f1e0', 'RAM-PC-CORSAIR-VENGEANCE-RGB-128GB-2X64GB-DDR5-640', 'RAM PC CORSAIR VENGEANCE RGB 128GB (2x64GB) DDR5 6400Mhz (CMH128GX5M2B6400C42)', 69990000, 10, 'RAM', '2026-10-08 02:53:42'),
('prd_45e31a50', 'CPU-INTEL-CORE-I5-12600KF-TRAY', 'CPU Intel Core i5-12600KF- TRAY NEW (3.7GHz turbo up to 4.9Ghz, 10 nhân 16 luồng, 20MB Cache, 125W) - Socket Intel LGA 1700)', 4990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_46cef37d', 'CPU-AMD-RYZEN-7-9700X', 'CPU AMD Ryzen 7 9700X (3.8 GHz Boost 5.5 GHz | 8 nhân / 16 luồng| 40MB Cache)', 9490000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_4770e4a0', 'CPU-INTEL-CORE-I5-13400F-TRAY', 'CPU Intel Core I5 13400F (10 Cores 16 Threads 20MB Up to 4.6GHz) - TRAY', 4790000, 10, 'CPU', '2026-10-08 02:50:38'),
('prd_48b11ed4', 'O-CUNG-WESTERN-DIGITAL-RED-PLUS-4TB-3-5-INCH-128MB', 'Ổ cứng Western Digital Red Plus 4TB 3.5 inch 128MB Cache 5400RPM WD40EFZZ', 5890000, 10, 'HDD', '2026-10-08 02:50:38'),
('prd_48d469de', 'CARD-MAN-HINH-GIGABYTE-AORUS-GEFORCE-RTX-5070-MAST', 'Card màn hình GIGABYTE AORUS GeForce RTX 5070 MASTER 12GB GDDR7', 29990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_4911eaed', 'CPU-AMD-RYZEN-9-9950X-TRAY', 'CPU AMD Ryzen 9 9950X - TRAY NEW (16 nhân 32 luồng, up to 5.7GHz, 80MB Cache)', 15590000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_493f5bd1', 'MAINBOARD-MSI-Z890-GAMING-PLUS-WIFI-DDR5', 'Mainboard MSI Z890 GAMING PLUS WIFI DDR5', 7899000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_49856825', 'NGUON-MAY-TINH-ASUS-PRIME-650B', 'Nguồn máy tính ASUS PRIME 650B (650W, 80 Plus Bronze, Non-modular, 6 năm bảo hành)', 1490000, 10, 'PSU', '2026-10-08 02:54:09'),
('prd_4af4c4fe', 'MAN-HINH-MSI-PRO-MP242-E14A-23-8-INCH-IPS-FHD-144H', 'Màn Hình MSI PRO MP242 E14A (23.8 inch - IPS - FHD - 144Hz - 1ms)', 2190000, 10, 'Màn hình', '2026-10-08 02:54:10'),
('prd_4b985828', 'CPU-AMD-RYZEN-9-7900X3D-4-4GHZ-UP-TO-5-6GHZ-140MB-', 'CPU AMD Ryzen 9 7900X3D (4.4Ghz up to 5.6Ghz/ 140MB/ 12 cores 24 threads/ 120W/ Sockets AM5)', 12799000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_4bfeb55f', 'NGUON-MAY-TINH-AIGO-VK750-750W-85-PLUS-ACTIVE-PFC-', 'Nguồn Máy Tính AIGO VK750 - 750W (85 Plus/ Active PFC/ Single Rail)', 1190000, 10, 'PSU', '2026-10-08 02:54:09'),
('prd_4c1ec67f', 'MAINBOARD-MSI-PRO-X870-P-WIFI', 'Mainboard MSI PRO X870-P WIFI (AMD X870, Socket AM5, ATX, 4 khe RAM DDR5)', 7690000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_4d926b88', 'MAN-HINH-LG-ULTRAGEAR-27G640A-B-27-INCH-IPS-2K-300', 'Màn Hình LG UltraGear 27G640A-B (27 inch/ IPS/ 2K/ 300Hz/ 1ms)', 7190000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_4e3134b2', 'MAINBOARD-GIGABYTE-B860M-AORUS-ELITE-WIFI-6E-DDR5', 'Mainboard Gigabyte B860M AORUS ELITE WIFI 6E DDR5', 5799000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_4eed7780', 'MAINBOARD-MSI-PRO-A620AM-B-EVO-DDR5', 'Mainboard MSI Pro A620AM-B EVO DDR5', 2190000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_4f1b6659', 'MAN-HINH-GAMING-ASUS-TUF-VG249Q5R-23-8-INCH-IPS-FH', 'Màn hình Gaming ASUS TUF VG249Q5R (23.8 inch - IPS - FHD - 200Hz - 0.3ms - Speaker )', 2590000, 10, 'Màn hình', '2026-10-08 02:50:38'),
('prd_4fc1de95', 'O-CUNG-SSD-CRUCIAL-P3-500GB-NVME-3D-NAND-M-2-PCIE-', 'Ổ cứng SSD Crucial P3 500GB NVMe 3D-NAND M.2 PCIe Gen3 x4  (CT500P3SSD8)', 2390000, 10, 'SSD', '2026-10-08 02:53:42'),
('prd_503ea025', 'RAM-HIKSEMI-ARMOR-16GB-BUS-3200MHZ-DDR4-U10-U-DIMM', 'Ram HIKSEMI ARMOR 16GB Bus  3200MHZ DDR4 U10 U-DIMM', 2590000, 10, 'RAM', '2026-10-08 02:53:41'),
('prd_5064bda8', 'NGUON-FSP-VITA-750BD-PPA7508005-BRONZE-DAY-LIEN-US', 'Nguồn FSP VITA 750BD - 750W (PPA7508005 BRONZE/DÂY LIỀN/US/ĐEN)', 1490000, 10, 'PSU', '2026-10-08 02:54:09'),
('prd_506d3898', 'CPU-INTEL-CORE-ULTRA-7-265K-UP-TO-5-5GHZ-20-NHAN-2', 'CPU Intel Core Ultra 7 265K (Up to 5.5GHz , 20 nhân - 20 luồng ,30MB Cache, Arrow Lake -S) - TRAY', 8990000, 10, 'CPU', '2026-10-08 02:50:38'),
('prd_50ba8135', 'CPU-INTEL-CORE-I7-14700KF-TRAY', 'CPU Intel Core I7 14700KF (20 Nhân 28 Luồng, Up to 5.6 GHz, 33MB Cache, Raptor Lake Refresh)- TRAY', 9990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_511ba463', 'VO-MAY-TINH-JONSBO-D34-BLACK-MINI-TOWER-M-ATX-DEN', 'Vỏ máy tính JONSBO D34 BLACK (Mini Tower/ M-ATX/ Đen)', 2190000, 10, 'Case', '2026-10-08 02:50:38'),
('prd_51e9329c', 'RAM-ADATA-XPG-LANCER-RGB-16GB-BUS-6000MHZ-DDR5', 'RAM Adata XPG Lancer RGB 16GB Bus 6000Mhz DDR5', 6990000, 10, 'RAM', '2026-10-08 02:50:38'),
('prd_520d8ef7', 'TAN-NHIET-NUOC-GAMDIAS-AURA-GL240-V2-ARGB-WHITE', 'Tản nhiệt nước Gamdias AURA GL240 V2 ARGB WHITE (WCAURAGL240V2WHGA)', 1470000, 10, 'Tản nhiệt', '2026-10-08 02:50:38'),
('prd_52a8a18d', 'CPU-AMD-RYZEN-9-9950X3D-TRAY', 'CPU AMD Ryzen 9 9950X3D - TRAY NEW (16 nhân 32 luồng, up to 5.7GHz ,144MB Cache , AM5)', 18990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_530bbc38', 'MAINBOARD-ASUS-TUF-GAMING-B550M-PLUS-WIFI-II', 'Mainboard Asus TUF GAMING B550M-PLUS WIFI II', 2950000, 10, 'Mainboard', '2026-10-08 02:50:38'),
('prd_535e4110', 'CPU-AMD-RYZEN-7-9850X3D', 'CPU AMD Ryzen 7 9850X3D (8 Nhân 16 Luồng | 5.6GHz | 96MB Cache L3 | AM5) - TRAY', 13990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_53a58abb', 'VO-CASE-XIGMATEK-HEAVEN', 'Vỏ Case Xigmatek Heaven E-ATX (Black)', 2190000, 10, 'Case', '2026-10-08 02:50:38'),
('prd_54907eb9', 'CARD-MAN-HINH-MSI-GEFORCE-RTX-5080-16G-GAMING-TRIO', 'Card màn hình MSI GeForce RTX 5080 16G GAMING TRIO OC', 55990000, 10, 'VGA', '2026-10-08 02:50:38'),
('prd_54e1dfc9', 'O-CUNG-SSD-GIGABYTE-4000E-500GB-M2-2280-NVME-GEN4X', 'Ổ cứng SSD GIGABYTE 4000E 500GB M2 2280 NVMe Gen4x4', 3390000, 10, 'SSD', '2026-10-08 02:53:42'),
('prd_5509c749', 'MAN-HINH-GAMING-LG-ULTRAGEAR-27G64NA-B', 'Màn Hình Gaming LG UltraGear 27G64NA-B (27 Inch/ QHD/ IPS/ 300Hz/ 1ms)', 7190000, 10, 'Màn hình', '2026-10-08 02:50:38'),
('prd_55fa7064', 'MAINBOARD-GIGABYTE-Z890-AERO-G', 'Mainboard GIGABYTE Z890 AERO G', 10590000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_56778991', 'VO-CASE-XIGMATEK-DYNAMIC-ML-ARCTIC-EN91141', 'Vỏ case XIGMATEK DYNAMIC ML ARCTIC - EN91141', 890000, 10, 'Case', '2026-10-08 02:50:38'),
('prd_5708c5be', 'COLORFUL-BATTLE-AX-Z890M-PLUS-V20', 'COLORFUL BATTLE-AX Z890M-PLUS V20', 5390000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_57328df4', 'CARD-MAN-HINH-ASUS-ROG-STRIX-GEFORCE-RTX-5070-TI-1', 'Card màn hình ASUS ROG Strix GeForce RTX 5070 Ti 16GB GDDR7', 49990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_57671929', 'MAINBOARD-ASUS-ROG-STRIX-Z890-A-GAMING-WIFI', 'Mainboard ASUS ROG Strix Z890-A GAMING WIFI', 13499000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_57963cc8', 'TAN-NHIET-KHI-THERMALRIGHT-PEERLESS-ASSASSIN-120-S', 'Tản nhiệt khí Thermalright Peerless Assassin 120 SE ARGB', 890000, 10, 'Tản nhiệt', '2026-10-08 02:54:09'),
('prd_587c31a9', 'MAINBOARD-ASUS-B650M-AYW-WIFI-DDR5', 'Mainboard ASUS B650M-AYW WIFI DDR5', 3290000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_59b7b636', 'CARD-MAN-HINH-MSI-GEFORCE-RTX-5050-VENTUS-2X-OC-8G', 'Card màn hình MSI GeForce RTX 5050 VENTUS 2X OC 8GB GDDR6', 10990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_5a49da5e', 'MAN-HINH-GAMING-ASUS-TUF-VG279Q5R-27-INCH-IPS-FHD-', 'Màn hình Gaming ASUS TUF VG279Q5R (27 inch - IPS - FHD - 200Hz - 0.3ms - Speaker )', 3290000, 10, 'Màn hình', '2026-10-08 02:50:38'),
('prd_5a73cb92', 'RAM-GSKILL-TRIDENT-Z5-RGB-64GB-2X32GB-DDR5-BUS-600', 'RAM GSKILL TRIDENT Z5 RGB 64GB (2X32GB) DDR5 Bus 6000 MHz (F5-6000J3636F32GX2-TZ5RK)', 29990000, 10, 'RAM', '2026-10-08 02:53:41'),
('prd_5ae37674', 'CARD-MAN-HINH-GIGABYTE-GEFORCE-RTX-5080-WINDFORCE-', 'Card màn hình GIGABYTE GeForce RTX 5080 WINDFORCE OC SFF 16GB', 47990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_5b2c4d03', 'MAN-HINH-GAMING-SSTC-S2720G-27-INCH', 'Màn hình Gaming SSTC S2720G 27 inch FHD 200Hz 1ms IPS', 2590000, 10, 'Màn hình', '2026-10-08 02:50:38'),
('prd_5b5d51b3', 'RAM-APACER-NOX-16GB-DDR5-BUS-6000MHZ', 'RAM Apacer NOX 16GB DDR5 Bus 6000MHz', 6490000, 10, 'RAM', '2026-10-08 02:50:38'),
('prd_5c491e39', 'CPU-INTEL-CORE-I5-12600K-TRAY', 'CPU Intel Core i5-12600K - TRAY NEW (3.7GHz turbo up to 4.9Ghz, 10 nhân 16 luồng, 20MB Cache, 125W)', 4890000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_5c73f6f7', 'MAINBOARD-ASUS-PRIME-B760M-K-DDR5', 'Mainboard ASUS PRIME B760M-K DDR5', 2690000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_5dba5bfc', 'NGUON-MAY-TINH-COOLER-MASTER-ELITE-GOLD-850W-FULL-', 'Nguồn máy tính Cooler Master Elite Gold 850W | Full Modular, 80 Plus Gold, ATX 3.1, PCIe 5.1', 2590000, 10, 'PSU', '2026-10-08 02:50:38'),
('prd_5e4b3ea4', 'CARD-MAN-HINH-ASUS-PRIME-GEFORCE-RTX-5060-8GB-GDDR', 'Card màn hình ASUS PRIME GeForce RTX 5060 8GB GDDR7 OC Edition (PRIME-RTX5060-O8G)', 15990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_6003b84b', 'RAM-DESKTOP-GSKILL-RIPJAWS-M5-RGB-BLACK-32GB-2X16G', 'Ram Desktop Gskill RIPJAWS M5 RGB BLACK  32GB (2x16GB) Bus 6000MHz DDR5  (F5-6000J3648D16GX2-RM5RK)', 13990000, 10, 'RAM', '2026-10-08 02:53:41'),
('prd_605a1681', 'CARD-MAN-HINH-ASUS-DUAL-GEFORCE-RTX-5060-TI-16GB-G', 'Card màn hình ASUS Dual GeForce RTX 5060 Ti 16GB GDDR7 OC Edition', 22990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_606b7e59', 'MAINBOARD-GIGABYTE-Z890-AORUS-PRO-ICE', 'Mainboard GIGABYTE Z890 AORUS PRO ICE DDR5', 13490000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_6155ae17', 'MAN-HINH-VAN-PHONG-SSTC-S2410-25-INCH-FHD-100HZ-IP', 'Màn hình văn phòng SSTC S2410 | 25 inch, FHD, 100Hz, IPS', 1490000, 10, 'Màn hình', '2026-10-08 02:50:38'),
('prd_618b207f', 'MAINBOARD-SSTC-H610M-HDV', 'MAINBOARD SSTC H610M-HDV', 1790000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_6431d509', 'CPU-INTEL-CORE-ULTRA-7-265K', 'CPU Intel Core Ultra 7 265K (Up to 5.5GHz , 20 nhân - 20 luồng ,30MB Cache, Arrow Lake -S)', 10790000, 10, 'CPU', '2026-10-08 02:50:38'),
('prd_65976d8a', 'O-CUNG-SSD-KINGSTON-NV3-1TB-PCIE-4-0-X4-M-2-NVME-S', 'Ổ cứng SSD Kingston NV3 1TB PCIe 4.0 x4 M.2 NVMe (SNV3S/1000G)', 4590000, 10, 'SSD', '2026-10-08 02:50:38'),
('prd_676628e9', 'O-CUNG-SSD-SAMSUNG-9100-PRO-2TB-PCIE-GEN5-X4-NVME', 'Ổ cứng SSD Samsung 9100 Pro 2TB PCIe Gen5 x4 NVMe (MZ-VAP2T0BW)', 20990000, 10, 'SSD', '2026-10-08 02:50:38'),
('prd_67be3a17', 'RAM-SSTC-16GB-DDR4-3200MHZ-AMD-INTEL-U3200A-C22', 'Ram SSTC 16GB DDR4 3200MHz AMD/Intel (U3200A-C22)', 2590000, 10, 'RAM', '2026-10-08 02:50:38'),
('prd_680bed3b', 'MAN-HINH-GAMING-LG-ULTRAGEAR-39GX950B-B', 'Màn Hình Gaming LG UltraGear 39GX950B-B (39 inch ,5K2K Tandem OLED , 330Hz , 0.03ms)', 40990000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_683c1168', 'MAN-HINH-DELL-ULTRASHARP-U2424HE-23-8-INCH-FHD-IPS', 'Màn Hình Dell UltraSharp U2424HE (23.8 inch - FHD - IPS - 120Hz - 5ms - DRR - TMDS - USB TypeC - Network RJ45)', 6490000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_69038446', 'CPU-INTEL-CORE-I7-12700-TRAY', 'CPU Intel Core i7-12700 - Tray (3.6GHz turbo up to 4.9Ghz, 12 nhân 20 luồng, 25MB Cache, 65W) - Socket Intel LGA 1700)', 8990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_69155325', 'MAINBOARD-DARKFLASH-H610M-VGD-V1', 'Mainboard DarkFlash H610M-VGD-V1', 1690000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_6aaf2c9b', 'MAINBOARD-ASUS-PRIME-X870-P-WIFI-CSM', 'Mainboard ASUS PRIME X870-P WIFI-CSM', 6990000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_6b1c7e8d', 'MAN-HINH-GAMING-SAMSUNG-ODYSSEY-OLED-G6-G60SD-LS27', 'Màn Hình Gaming SAMSUNG Odyssey OLED G6 G60SD LS27DG602SEXXV (27 inch - OLED - 2K - 360 hz - 0.03ms)', 15980000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_6b639bac', 'CARD-MAN-HINH-ASUS-PRIME-GEFORCE-RTX-5070-12GB-GDD', 'Card màn hình ASUS PRIME GeForce RTX 5070 12GB GDDR7', 25990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_6d929eff', 'CARD-MAN-HINH-MSI-RTX-5060-8GB-SHADOW-2X-OC', 'Card màn hình MSI RTX 5060 8GB SHADOW 2X OC', 14990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_6e310dae', 'TAN-NHIET-NUOC-GAMDIAS-AURA-GL240-LITE-II-DIGITAL', 'Tản nhiệt nước Gamdias AURA GL240 LITE II DIGITAL (WCAURAGL240LTIIDIBLGA)', 1550000, 10, 'Tản nhiệt', '2026-10-08 02:54:09'),
('prd_6e8692e3', 'CARD-MAN-HINH-ASUS-TUF-GAMING-GEFORCE-RTX-5070-TI-', 'Card màn hình ASUS TUF Gaming GeForce RTX 5070 Ti 16GB GDDR7 WHITE OC', 47990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_6e8b5dea', 'MAINBOARD-SSTC-H510M-HD', 'MAINBOARD SSTC H510M-HD', 1790000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_6ee12b63', 'MAN-HINH-LG-27U411A-B-27-INCH-FHD-IPS-120HZ-1MS', 'Màn hình LG 27U411A-B (27 inch/FHD/IPS/120Hz/5ms)', 2790000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_6f64cce6', 'CARD-MAN-HINH-COLORFUL-IGAME-GEFORCE-RTX-5070-ULTR', 'Card Màn Hình COLORFUL iGame GeForce RTX 5070 Ultra W OC 12GB-V', 26990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_6fb2815d', 'MAN-HINH-DO-HOA-ASUS-PROART-PA278QGV-27-INCH-IPS-2', 'Màn Hình Đồ Họa ASUS ProArt PA278QGV (27 inch - IPS - 2K - 120Hz - 5ms - Speaker)', 8490000, 10, 'Màn hình', '2026-10-08 02:50:38'),
('prd_703e708c', 'MAINBOARD-ASROCK-A620AM-HVS', 'Mainboard ASRock A620AM - HVS (Chipset AMD A620A, Socket AM5, 2xDDR5, Micro-ATX)', 2290000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_71fcef91', 'MAN-HINH-ASUS-ROG-SWIFT-OLED-PG27AQWP-W', 'Màn hình ASUS ROG Swift OLED PG27AQWP-W (27 inch/OLED/QHD@540Hz & HD@720Hz/0.02ms)', 39890000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_724ef67b', 'MAN-HINH-ASUS-ROG-STRIX-OLED-XG27UQDMS', 'Màn hình ASUS ROG Strix OLED XG27UQDMS (27in / UHD / OLED / 240Hz / 0.03ms)', 25990000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_72bfc33f', 'RAM-CORSAIR-VENGEANCE-LPX-16GB-DDR5-5200MHZ-BLACK-', 'RAM Corsair Vengeance LPX 16GB DDR5 5200MHz Black (CMK16GX5M1B5200C40)', 5890000, 10, 'RAM', '2026-10-08 02:50:38'),
('prd_7307ba1e', 'O-CUNG-NVME-KIOXIA-EXCERIA-BASIC-1TB-GEN-4X4', 'Ổ CỨNG NVME KIOXIA EXCERIA BASIC 1TB GEN 4X4 (6600 MB/s - 7200 MB/s)', 5390000, 10, 'SSD', '2026-10-08 02:50:38'),
('prd_7345e54d', 'NGUON-MAY-TINH-GAMDIAS-AURA-GP550-550W', 'Nguồn máy tính Gamdias AURA GP550 550W - 80 PLUS White', 640000, 10, 'PSU', '2026-10-08 02:50:38'),
('prd_7368935d', 'MAINBOARD-ASUS-TUF-GAMING-B860M-PLUS-WIFI', 'Mainboard Asus TUF GAMING B860M-PLUS WIFI', 7199000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_7372fff8', 'MAINBOARD-MSI-B760M-GAMING-PLUS-WIFI-DDR5', 'Mainboard MSI B760M GAMING PLUS WIFI DDR5', 3890000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_739f512c', 'CARD-MAN-HINH-MSI-GEFORCE-RTX-5070-12G-VENTUS-3X-O', 'Card màn hình MSI GeForce RTX 5070 12G VENTUS 3X OC', 26990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_73a84d05', 'CPU-AMD-RYZEN-5-7500X3D', 'CPU AMD Ryzen 5 7500X3D ( 6 Core - 12 Thread - Base 4.0Ghz - Turbo 4.5Ghz - Cache 102MB,AM5)', 6990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_73c278f8', 'MAINBOARD-MSI-PRO-Z890-P-WIFI-DDR5', 'Mainboard MSI PRO Z890 - P WIFI DDR5', 6999000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_74c376a1', 'MAINBOARD-SAPPHIRE-PURE-B850M-WIFI', 'Mainboard Sapphire PURE B850M WIFI (M-ATX, DDR5, AM5, Lan 2.5G, WIFI 6, BT 5.3)', 4890000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_74d420c6', 'MAINBOARD-ASUS-Z890-AYW-GAMING-WIFI-W-DDR5', 'Mainboard Asus Z890 AYW Gaming WIFI W DDR5', 6990000, 10, 'Mainboard', '2026-10-08 02:50:38'),
('prd_74dda278', 'TAN-NHIET-NUOC-GAMDIAS-AURA-GL360-V2-ARGB-WHITE', 'Tản nhiệt nước Gamdias AURA GL360 V2 ARGB White (WAAURAGL360V2WHGA)', 1790000, 10, 'Tản nhiệt', '2026-10-08 02:50:38'),
('prd_7513397f', 'MAN-HINH-ASUS-TUF-VG279Q3R-27-INCH-FHD-IPS-180HZ-1', 'Màn hình ASUS TUF VG279Q3R (27 inch/FHD/IPS/180Hz/1ms/Loa)', 3580000, 10, 'Màn hình', '2026-10-08 02:50:38'),
('prd_75dac9c6', 'MAINBOARD-ASROCK-H610M-H2-M-2', 'Mainboard Asrock H610M-H2/M.2', 1690000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_7603b32b', 'MAINBOARD-ASUS-PRIME-A620M-E-DDR5', 'Mainboard Asus Prime A620M-E DDR5', 2590000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_7637f8de', 'CARD-MAN-HINH-ZOTAC-GEFORCE-RTX-3050-6GB-GDDR6-TWI', 'Card màn hình ZOTAC GeForce RTX 3050 6GB GDDR6 Twin Edge', 5890000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_7642506d', 'MAINBOARD-GIGABYTE-B850M-GAMING-X-WIFI-6E', 'Mainboard Gigabyte B850M GAMING X WIFI 6E', 5399000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_772c7c8f', 'MAN-HINH-GAMING-SAMSUNG-ODYSSEY-OLED-G8-G85SD-LS34', 'Màn Hình Gaming SAMSUNG Odyssey OLED G8 G85SD LS34DG850SEXXV (34 inch - OLED - UWQHD - 175Hz - 0.03ms - Cong)', 23480000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_77452e51', 'MAN-HINH-DELL-PRO-24-PLUS-P2425D', 'Màn Hình Dell Pro 24 Plus P2425D (23.8 inch - IPS - 2K - 100Hz - 5ms)', 6390000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_78dded7f', 'NGUON-MAY-TINH-SUPER-FLOWER-ZILLION-DB-BRONZE-750W', 'Nguồn máy tính Super Flower ZILLION DB Bronze 750W ATX 3.1 (80 PLUS BRONZE ,SF-750Z12DB-DA)', 1890000, 10, 'PSU', '2026-10-08 02:54:09'),
('prd_794a1d6b', 'CARD-MAN-HINH-COLORFUL-IGAME-GEFORCE-RTX-5060-TI-N', 'Card Màn Hình Colorful iGame GeForce RTX 5060 Ti NB DUO 16GB-V', 22990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_7a173386', 'MAN-HINH-GAMING-LG-ULTRAGEAR-27G550B-B', 'Màn Hình Gaming LG UltraGear 27G550B-B (27 inch - IPS - FHD - 300Hz - 1ms)', 5290000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_7a59e125', 'CARD-MAN-HINH-MSI-GEFORCE-RTX-5090-32G-SUPRIM-SOC', 'Card màn hình MSI GeForce RTX 5090 32GB SUPRIM SOC', 189990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_7aa8f9e8', 'CARD-MAN-HINH-GIGABYTE-GEFORCE-RTX-5070-WINDFORCE-', 'Card màn hình GIGABYTE GeForce RTX 5070 WINDFORCE OC SFF 12GB', 25990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_7ab730b9', 'CARD-MAN-HINH-ASUS-ROG-STRIX-GEFORCE-RTX-5070-12GB', 'Card màn hình ASUS ROG Strix GeForce RTX 5070 12GB GDDR7 OC', 35990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_7b15e4f3', 'CPU-AMD-RYZEN-7-9800X3D-8-NHAN-16-LUONG-47GHZ-UP-T', 'CPU AMD Ryzen 7 9800X3D (8 nhân 16 luồng/ 4.7GHz up to 5.2GHz/ 120W)- TRAY', 12980000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_7dfc86a5', 'CARD-MAN-HINH-MSI-GEFORCE-RTX-5090-32G-VANGUARD-SO', 'Card màn hình MSI GeForce RTX 5090 32G VANGUARD SOC', 189990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_7f284263', 'CARD-MAN-HINH-ASUS-DUAL-GEFORCE-RTX-3060-OC-EDITIO', 'Card màn hình ASUS Dual GeForce RTX 3060 OC Edition 12GB V2 (DUAL-RTX3060-O12G-V2)', 10990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_7f933aa3', 'MAINBOARD-ASUS-ROG-STRIX-B850-E-GAMING-WIFI', 'Mainboard ASUS ROG STRIX B850-E GAMING WIFI', 11399000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_804fb3f1', 'MAN-HINH-DELL-PRO-E2425HSM', 'Màn Hình Dell Pro E2425HSM (23.8 inch - IPS - FHD - 100Hz - 5ms - speaker)', 3390000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_809c1c91', 'CARD-MAN-HINH-MSI-RTX-3050-6GB-VENTUS-2X-OC', 'Card màn hình MSI RTX 3050 6GB VENTUS 2X OC', 5990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_812ccf9c', 'CARD-MAN-HINH-ZOTAC-GAMING-GEFORCE-RTX-5060-8GB-TW', 'Card màn hình ZOTAC GAMING GeForce RTX 5060 8GB Twin Edge', 14990000, 10, 'VGA', '2026-10-08 02:50:38'),
('prd_81bcd4f6', 'CARD-MAN-HINH-GIGABYTE-AORUS-GEFORCE-RTX-5090-MAST', 'Card màn hình GIGABYTE AORUS GeForce RTX 5090 MASTER 32GB GDDR7', 189990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_81d105b8', 'O-CUNG-HDD-WD-2TB-BLUE-3-5-INCH-7200RPM-SATA-III-2', 'Ổ Cứng HDD WD 2TB Blue 3.5 inch, 7200RPM, SATA III, 256MB Cache (WD20EZBX)', 4090000, 10, 'HDD', '2026-10-08 02:50:38'),
('prd_820e9cad', 'RAM-DESKTOP-ADATA-XPG-SPECTRIX-D50-RGB-GREY-16GB-1', 'Ram Adata XPG Spectrix D50 RGB Grey 16GB (1x16GB) DDR4 3200Mhz (AX4U320016G16A-ST50)', 3990000, 10, 'RAM', '2026-10-08 02:53:41'),
('prd_82557993', 'NGUON-MAY-TINH-SUPER-FLOWER-LEADEX-TITANIUM-2200W-', 'Nguồn máy tính Super Flower Leadex Titanium 2200W ATX 3.1 Black | Cybenetics Titanium (SF-2200F14HP)', 13690000, 10, 'PSU', '2026-10-08 02:50:38'),
('prd_82710c30', 'MAN-HINH-SAMSUNG-ODYSSEY-OLED-G8-G81SF-LS27FG812SE', 'Màn Hình SAMSUNG Odyssey OLED G8 G81SF LS27FG812SEXXV (27 inch - OLED - 4K - 240Hz - 0.03ms)', 26280000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_8279c32b', 'CPU-INTEL-CORE-I7-13700KF-TRAY', 'CPU Intel Core i7-13700KF - TRAY (Up To 5.40GHz, 16 Nhân 24 Luồng, 25M Cache, Raptor Lake)', 8990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_8348d11b', 'MAN-HINH-GAMING-ASUS-TUF-GAMING-VG259QM5A-24-5-INC', 'Màn Hình Gaming ASUS TUF Gaming VG259QM5A (24.5 inch/ Fast IPS/ FHD/ 0.3ms/ 240Hz)', 3190000, 10, 'Màn hình', '2026-10-08 02:50:38'),
('prd_83cb0d21', 'MAINBOARD-ASUS-PRIME-X870-P-CSM', 'Mainboard ASUS PRIME X870-P-CSM', 6590000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_84f7fdfe', 'MAN-HINH-GAMING-ASUS-ROG-STRIX-OLED-XG27AQDMG', 'Màn hình Gaming ASUS ROG Strix OLED XG27AQDMG (27 inch - QHD - OLED - 240Hz - G-SYNC - DisplayHDR 400)', 14790000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_85597041', 'CPU-INTEL-CORE-I5-14600KF-TRAY', 'CPU Intel Core I5 14600KF (Up 5.30 GHz, 14 Nhân 20 Luồng, 24MB Cache, Raptor Lake Refresh) - TRAY', 6490000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_86aae8a0', 'CARD-MAN-HINH-MSI-RTX-5060-8GB-VENTUS-2X-OC', 'Card màn hình MSI RTX 5060 8GB VENTUS 2X OC', 14990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_86bff14c', 'CPU-AMD-RYZEN-9-9900X3D', 'CPU AMD Ryzen 9 9900X3D (12 nhân 24 luồng, up to 5.5GHz ,140MB Cache , AM5)', 16999000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_87215dcf', 'MAINBOARD-MSI-MEG-Z890-GODLIKE-DDR5', 'Mainboard MSI MEG Z890 GODLIKE DDR5', 40399000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_87236dcb', 'TAN-NHIET-NUOC-GAMDIAS-CHIONE-P5-240-ARGB-WHITE', 'Tản nhiệt nước Gamdias CHIONE P5-240 ARGB WHITE (WCCNEP5240WHGA)', 3590000, 10, 'Tản nhiệt', '2026-10-08 02:50:38'),
('prd_87e1ac60', 'CARD-MAN-HINH-MSI-GEFORCE-RTX-5070-12G-GAMING-TRIO', 'Card màn hình MSI GeForce RTX 5070 12G GAMING TRIO OC', 27990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_891c9f5a', 'MAINBOARD-MSI-B650M-GAMING-PLUS-WIFI', 'Mainboard MSI B650M GAMING PLUS WIFI', 4499000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_8a37e701', 'CARD-PNY-GEFORCE-RTX-5060-8GB-ARGB-EPIC-X-RGB-OC-T', 'Card màn hình PNY GEFORCE RTX 5060 8GB ARGB EPIC-X RGB OC TRIPLE FAN', 14990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_8a7932a2', 'MAINBOARD-GIGABYTE-B760M-GAMING-PLUS-WIFI-DDR4', 'Mainboard Gigabyte B760M GAMING PLUS WIFI DDR4', 2990000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_8b293939', 'CPU-AMD-RYZEN-5-4600G-3-7-GHZ-TURBO-UPTO-4-2GHZ-11', 'CPU AMD Ryzen 5 4600G (3.7 GHz turbo upto 4.2GHz / 11MB / 6 Cores, 12 Threads / 65W / Socket AM4)', 2699000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_8c2d30e7', 'CPU-AMD-RYZEN-RYZEN-5-7500F-3-7-GHZ-UPTO-5-0GHZ-38', 'CPU AMD Ryzen Ryzen 5 7500F (3.7 GHz Upto 5.0GHz / 38MB / 6 Cores, 12 Threads / 65W / Socket AM5)', 5299000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_8c69aabf', 'CPU-INTEL-CORE-ULTRA-7-270K-PLUS-TRAY', 'CPU Intel Core Ultra 7 270K Plus (24 Nhân 24 Luồng , Up 5.5GHz) -TRAY', 10590000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_8c8d0df8', 'CPU-INTEL-CORE-I5-11400F-TRAY', 'CPU Intel Core i5-11400F - Tray (2.6GHz turbo up to 4.4Ghz, 6 nhân 12 luồng, 12MB Cache, 65W) - Socket Intel LGA 1200', 2990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_8e212deb', 'MAN-HINH-GAMING-GIGABYTE-GS25F2-24-5-INCH-FHD-IPS-', 'MÀN HÌNH GAMING GIGABYTE GS25F2 (24.5 INCH / FHD / IPS/ 200Hz / 1MS )', 2590000, 10, 'Màn hình', '2026-10-08 02:50:38'),
('prd_8e51d008', 'MAINBOARD-ASROCK-X870-PRO-RS-WIFI-1', 'Mainboard ASRock X870 Pro RS Wifi', 6990000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_8e7d02a1', 'CPU-INTEL-CORE-ULTRA-7-265KF-TRAY', 'CPU Intel Core Ultra 7 265KF (Up to 5.5GHz , 20 nhân - 20 luồng ,30MB Cache, Arrow Lake -S) - TRAY', 8680000, 10, 'CPU', '2026-10-08 02:50:38'),
('prd_8eb9215a', 'MAINBOARD-MSI-MEG-Z890-UNIFY-X', 'Mainboard MSI MEG Z890 UNIFY-X (Intel Z890, Socket 1851, ATX, RAM DDR5)', 21999000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_8f716c4e', 'MAINBOARD-ASUS-TUF-GAMING-B850-PLUS-WIFI', 'Mainboard ASUS TUF GAMING B850-PLUS WIFI', 7499000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_918192e4', 'MAINBOARD-MSI-PRO-Z890-A-WIFI-DDR5', 'Mainboard MSI PRO Z890 - A WIFI DDR5', 7699000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_919c399b', 'CARD-MAN-HINH-MSI-GEFORCE-RTX-5060-TI-16G-GAMING-O', 'Card màn hình MSI GeForce RTX 5060 Ti 16G GAMING OC', 22990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_91fc0b90', 'MAINBOARD-MSI-PRO-Z890-S-WIFI-DDR5', 'Mainboard MSI PRO Z890 - S WIFI DDR5', 6399000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_9203c4f9', 'TAN-NHIET-NUOC-GAMDIAS-AURA-GL240-V2-ARGB-BLACK', 'Tản nhiệt nước Gamdias AURA GL240 V2 ARGB BLACK (WCAURAGL240V2BLGA)', 1370000, 10, 'Tản nhiệt', '2026-10-08 02:50:38'),
('prd_931135c8', 'O-CUNG-SSD-PATRIOT-P300-2TB-NVME-P300P2TBM28', 'Ổ cứng SSD Patriot P300 2TB PCIe Gen 3 x 4 NVMe (P300P2TBM28)', 5290000, 10, 'SSD', '2026-10-08 02:50:38'),
('prd_93220551', 'CARD-MAN-HINH-MSI-GEFORCE-RTX-5070-12G-VENTUS-2X-O', 'Card màn hình MSI GeForce RTX 5070 12G VENTUS 2X OC WHITE', 25990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_93d9e8a8', 'VO-MAY-TINH-GAMDIAS-ATLAS-P6-CG-ARGB-MID-TOWER-BLA', 'Vỏ Máy Tính GAMDIAS ATLAS P6 CG ARGB (Mid-Tower, Black)', 3590000, 10, 'Case', '2026-10-08 02:50:38'),
('prd_945524b9', 'MAN-HINH-DELL-P2725D', 'Màn hình Dell P2725D (27 inch - IPS - QHD - 100Hz- 5ms)', 6980000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_949b7dec', 'CARD-MAN-HINH-MSI-GEFORCE-RTX-5060-TI-8G-GAMING-TR', 'Card màn hình MSI GeForce RTX 5060 Ti 8G GAMING TRIO OC', 17990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_959ad7dd', 'MAINBOARD-GIGABYTE-B650EM-FORCE-WIFI6E', 'Mainboard Gigabyte B650EM FORCE WIFI6E (AM5, mATX, 2x DDR5, Wi-Fi 6E)', 3290000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_9605b2b7', 'MAN-HINH-GAMING-ASUS-TUF-GAMING-VG279QE5A', 'Màn Hình Gaming ASUS TUF Gaming VG279QE5A (27 inch - FHD - IPS - 146Hz - 1ms - Speaker)', 2990000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_967fe457', 'CPU-AMD-RYZEN-7-5700X-TRAY', 'CPU AMD RYZEN 7 5700X ( 3.4 GHz (4.6GHz Max Boost) / 36MB Cache / 8 cores, 16 threads / 65W / Socket AM4) TRAY', 4390000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_96e96606', 'NGUON-MAY-TINH-AIGO-GB750-750W-80-PLUS-BRONZE-MAU-', 'Nguồn máy tính AIGO GB750 - 750W (80 Plus Bronze/Màu Đen)', 1390000, 10, 'PSU', '2026-10-08 02:54:09'),
('prd_97d85c39', 'MAINBOARD-ASUS-PRIME-B760M-A-WIFI-D4-CSM', 'Mainboard ASUS PRIME B760M-A WIFI D4-CSM', 3390000, 10, 'Mainboard', '2026-10-08 02:52:52');
INSERT INTO `products` (`id`, `sku`, `name`, `unit_price`, `stock_qty`, `category`, `created_at`) VALUES
('prd_97d93e7a', 'MAINBOARD-ASUS-PRIME-Z890M-PLUS-WIFI-CSM-DDR5', 'Mainboard ASUS PRIME Z890M-PLUS WIFI-CSM DDR5', 6190000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_97e652bd', 'MAN-HINH-ASUS-VA27AQSE', 'Màn Hình ASUS VA27AQSE (27 inch - IPS - 2K - 75Hz - 1ms - Speaker)', 3490000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_992f350a', 'CARD-MAN-HINH-COLORFUL-IGAME-RTX-5070-VULCAN-OC-12', 'Card Màn Hình Colorful iGame RTX 5070 Vulcan OC 12GB', 27990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_9931e4ce', 'MAINBOARD-ASUS-ROG-CROSSHAIR-X870E-EDITION-20', 'Mainboard Asus ROG CROSSHAIR X870E EDITION 20', 99990000, 10, 'Mainboard', '2026-10-08 02:50:38'),
('prd_995017d3', 'CARD-MAN-HINH-GIGABYTE-AORUS-GEFORCE-RTX-5070-TI-M', 'Card màn hình GIGABYTE AORUS GeForce RTX 5070 Ti MASTER 16GB GDDR7', 49990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_9976adb6', 'CPU-AMD-RYZEN-3-3200G-TRAY', 'CPU AMD Ryzen 3 3200G - TRAY (3.6 GHz Upto 4.0 GHz / 6MB / 4 Cores, 4 Threads / Socket AM4)', 1690000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_9a197d67', 'CPU-AMD-RYZEN-5-7600X3D-UP-TO-4-7-GHZ-102MB-CACHE-', 'CPU AMD RYZEN 5 7600X3D (UP TO 4.7 GHZ, 102MB CACHE, 6 NHÂN 12 LUỒNG, AM5)', 7990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_9a20fbed', 'MAN-HINH-GAMING-LG-ULTRAGEAR-25G523B-B', 'Màn Hình Gaming LG UltraGear 25G523B-B (25 inch - IPS - FHD - 200Hz - 1ms)', 3190000, 10, 'Màn hình', '2026-10-08 02:50:38'),
('prd_9b9f572b', 'MAINBOARD-COLORFUL-COLORFIRE-B850M-MEOW-WIFI7-V14', 'MAINBOARD COLORFUL COLORFIRE B850M-MEOW WIFI7 V14', 4690000, 10, 'Mainboard', '2026-10-08 02:50:38'),
('prd_9ca28ee9', 'RAM-TEAMGROUP-T-CREATE-EXPERT-128GB-2X64GB-DDR5-64', 'RAM TeamGroup T-Create EXPERT 128GB (2x64GB) DDR5 6400Mhz Black', 69990000, 10, 'RAM', '2026-10-08 02:50:38'),
('prd_9d6a5820', 'CARD-MAN-HINH-GIGABYTE-GEFORCE-RTX-5070-EAGLE-OC-I', 'Card màn hình GIGABYTE GeForce RTX 5070 EAGLE OC ICE SFF 12GB', 25990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_9e619e64', 'CPU-AMD-RYZEN-7-9700X-TRAY', 'CPU AMD Ryzen 7 9700X - TRAY NEW (3.8 GHz Boost 5.5 GHz | 8 nhân / 16 luồng| 40MB Cache)- TRAY', 7990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_9ec615e0', 'RAM-DESKTOP-COLORFUL-JEDEC-16GB-1X16GB-DDR4-3200MH', 'RAM DESKTOP COLORFUL JEDEC 16GB (1X16GB) DDR4 3200MHZ', 2890000, 10, 'RAM', '2026-10-08 02:50:38'),
('prd_9ed4fb28', 'CPU-INTEL-CORE-ULTRA-5-245K', 'CPU Intel Core Ultra 5 245K  (Up to 5.2GHz , 14 nhân - 14 luồng ,24MB Cache, Arrow Lake -S)', 9399000, 10, 'CPU', '2026-10-08 02:50:38'),
('prd_9f5e381a', 'NGUON-MAY-TINH-SUPER-FLOWER-LEADEX-VIII-PLATINUM-P', 'Nguồn máy tính Super Flower LEADEX VIII Platinum PRO 1200W ATX 3.1 BLACK | Cybenetics Platinum (SF-1200F14SP(T))', 6490000, 10, 'PSU', '2026-10-08 02:50:38'),
('prd_a049a23a', 'CARD-MAN-HINH-ASUS-TUF-GAMING-GEFORCE-RTX-5090-32G', 'Card màn hình ASUS TUF Gaming GeForce RTX 5090 32GB GDDR7 OC', 189990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_a11f5bb2', 'MAN-HINH-GAMING-ASUS-ROG-STRIX-OLED-XG27ACDMS', 'Màn Hình Gaming ASUS ROG Strix OLED XG27ACDMS (26.5 inch - QD-OLED - 2K - 0.03ms - 280Hz)', 15490000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_a1a862dd', 'CPU-INTEL-CORE-I5-14400F-TRAY', 'CPU Intel Core i5 14400F - TRAY (Up To 4.70GHz, 10 Nhân 16 Luồng, 20MB Cache, LGA 1700)', 4590000, 10, 'CPU', '2026-10-08 02:50:38'),
('prd_a2420d02', 'MAN-HINH-DELL-P2425H-23-8-INCH-FHD-IPS-100HZ-5MS-U', 'Màn Hình Dell P2425H (23.8 inch - FHD - IPS - 100Hz - 5ms - USB TypeC)', 4490000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_a266c711', 'MAN-HINH-GAMING-LG-ULTRAGEAR-25G550B-B', 'Màn Hình Gaming LG UltraGear 25G550B-B (24.5 inch - IPS - FHD - 300Hz - 1ms)', 4690000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_a2b0f003', 'O-CUNG-SSD-KIOXIA-EXCERIA-PLUS-G3-2TB-NVME-GEN-4X4', 'Ổ cứng SSD Kioxia EXCERIA PLUS G3 2TB NVMe Gen 4x4 LSD10Z002TG8', 7290000, 10, 'SSD', '2026-10-08 02:50:38'),
('prd_a2ca78e9', 'RAM-G-SKILL-RIPJAWS-M5-RGB-64GB-2X32GB-5200MHZ-DDR', 'Ram G.Skill Ripjaws M5 RGB 64GB (2x32GB) 5200MHz DDR5 (F5-5200J4040A32GX2-RM5RK)', 29990000, 10, 'RAM', '2026-10-08 02:53:42'),
('prd_a2d5d46e', 'NGUON-FSP-HV-PRO-85-650W-WHITE', 'Nguồn FSP HV PRO 85+ 650W WHITE (80 Plus Bronze/ATX 3.1/EU/TRẮNG)', 1290000, 10, 'PSU', '2026-10-08 02:54:09'),
('prd_a2d5dc2e', 'MAINBOARD-MSI-B760M-GAMING-PLUS-WIFI-DDR4', 'Mainboard MSI B760M GAMING PLUS WIFI DDR4', 3290000, 10, 'Mainboard', '2026-10-08 02:50:38'),
('prd_a53b8811', 'O-CUNG-SSD-SAMSUNG-9100-PRO-1TB-M-2-NVME', 'Ổ cứng SSD Samsung 9100 PRO 1TB M.2 NVMe M.2 2280 PCIe Gen5.0 x4', 9990000, 10, 'SSD', '2026-10-08 02:50:38'),
('prd_a5615a0f', 'CPU-AMD-RYZEN-5-5500-TRAY', 'CPU AMD Ryzen 5 5500 - Tray (3.6 GHz Upto 4.2GHz / 19MB / 6 Cores, 12 Threads / 65W / Socket AM4)', 2590000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_a5ec7bca', 'VO-CASE-ASUS-ROG-GR20-EDITION-20', 'Vỏ Case Asus ROG GR20 Edition 20 (Mid Tower/ Màu Đen)', 19990000, 10, 'Case', '2026-10-08 02:50:38'),
('prd_a6184b9c', 'NGUON-GAMDIAS-HELIOUS-M2-850B-850W-BLACK', 'Nguồn Gamdias Helious M2-850B 850W Black - 80 Plus Silver (PSUHELIM2850GA)', 2050000, 10, 'PSU', '2026-10-08 02:50:38'),
('prd_a633ea76', 'CARD-MAN-HINH-GIGABYTE-GEFORCE-RTX-5090-WINDFORCE-', 'Card màn hình GIGABYTE GeForce RTX 5090 WINDFORCE OC 32GB', 189990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_a7498d0e', 'MAINBOARD-ASUS-A620M-K-DDR5', 'Mainboard ASUS A620M-K DDR5', 2590000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_a8080cfb', 'VO-MAY-TINH-JONSBO-D34-WHITE', 'Vỏ máy tính JONSBO D34 WHITE (Mini Tower/ M-ATX/ Trắng)', 2290000, 10, 'Case', '2026-10-08 02:50:38'),
('prd_a81a4bb6', 'O-CUNG-WD-CAVIAR-BLUE-1TB-64MB-CACHE-5400-RPM-WD10', 'Ổ cứng WD Caviar Blue 1TB 64MB Cache 5400 RPM (WD10EARZ)', 3790000, 10, 'HDD', '2026-10-08 02:50:38'),
('prd_a8d07157', 'TAN-NHIET-NUOC-AIO-EINAREX-VERTEX-LITE-240MM-BLACK', 'Tản nhiệt nước AIO EINAREX VERTEX Lite 240mm Black', 1390000, 10, 'Tản nhiệt', '2026-10-08 02:50:38'),
('prd_a8dcba0e', 'CPU-AMD-RYZEN-9-9900X-TRAY', 'CPU AMD Ryzen 9 9900X - TRAY NEW (4.4 GHz Boost 5.6 GHz | 12 nhân / 24 luồng| 64 MB Cache)- TRAY', 10990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_aa22cbe9', 'RAM-PC-CORSAIR-VENGEANCE-RGB-96GB-2X48GB-DDR5-6000', 'RAM PC CORSAIR VENGEANCE RGB 96GB (2x48GB) DDR5 6000Mhz (CMH96GX5M2E6000C36)', 39990000, 10, 'RAM', '2026-10-08 02:53:41'),
('prd_aa27974f', 'CPU-INTEL-CORE-I5-12400-TRAY', 'CPU Intel Core i5-12400 - TRAY (Upto 4.4Ghz, 6 nhân 12 luồng, 18MB Cache, 65W) - Socket Intel LGA 1700)', 4790000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_ac1778eb', 'MAINBOARD-ASUS-TUF-GAMING-B850M-PLUS-WIFI', 'Mainboard ASUS TUF GAMING B850M-PLUS WIFI', 6599000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_ac6714ba', 'CARD-MAN-HINH-ASUS-TUF-GAMING-GEFORCE-RTX-5070-12G', 'Card màn hình ASUS TUF Gaming GeForce RTX 5070 12GB GDDR7', 27990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_ad68985c', 'MAINBOARD-GIGABYTE-X870M-AORUS-ELITE-WIFI-7', 'Mainboard Gigabyte X870M AORUS ELITE WIFI 7', 6790000, 10, 'Mainboard', '2026-10-08 02:50:38'),
('prd_ad701476', 'TAN-NHIET-COOLER-MASTER-HYPER-620S-ARGB', 'Tản nhiệt Cooler Master HYPER 620S ARGB', 790000, 10, 'Tản nhiệt', '2026-10-08 02:50:38'),
('prd_ae2fd93a', 'RAM-AGI-16GB-BUS-5600MHZ-DDR5-AGI560A16UD238-ST', 'Ram AGI 16GB BUS 5600Mhz DDR5 (AGI560A16UD238-ST)', 5490000, 10, 'RAM', '2026-10-08 02:53:41'),
('prd_ae424de0', 'MAN-HINH-GAMING-SAMSUNG-ODYSSEY-G5-G53F-LS27FG530E', 'Màn Hình Gaming SAMSUNG Odyssey G5 G53F LS27FG530EEXXV (27 inch - IPS - 2K - 200Hz - 1ms)', 4890000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_aee7f7b4', 'RAM-SSTC-8GB-BUS-3200MHZ-DDR4-XMP-EXPO-TAN-NHIET', 'Ram SSTC 8GB Bus 3200Mhz DDR4 BLACK TẢN NHIỆT', 1790000, 10, 'RAM', '2026-10-08 02:53:41'),
('prd_af571763', 'VO-MAY-TINH-JONSBO-D33-WHITE', 'Vỏ máy tính JONSBO D33 WHITE (Mini Tower/ M-ATX/ Trắng)', 1990000, 10, 'Case', '2026-10-08 02:50:38'),
('prd_af6dd3a6', 'MAINBOARD-GIGABYTE-B650M-AORUS-ELITE-AX-DDR5', 'Mainboard Gigabyte B650M AORUS ELITE AX DDR5', 4590000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_b07e27d1', 'CARD-MAN-HINH-COLORFUL-GEFORCE-RTX-5060-NB-DUO-8GB', 'Card màn hình Colorful GeForce RTX 5060 NB DUO 8GB-V', 14990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_b11be118', 'CPU-AMD-RYZEN-5-8400F-TRAY-NEW', 'CPU AMD Ryzen 5 8400F Tray New (4.2 GHz Boost 4.7 GHz | 6 Cores / 12 Threads | 16 MB Cache)', 3290000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_b12cf9ce', 'NGUON-SUPER-FLOWER-LEADEX-PLATINUM-1600W-SF-1600F1', 'Nguồn Super Flower Leadex Platinum 1600W SF-1600F14HP', 8750000, 10, 'PSU', '2026-10-08 02:50:38'),
('prd_b13c57c1', 'MAINBOARD-ASUS-TUF-GAMING-X870-PLUS-WIFI', 'Mainboard ASUS TUF GAMING X870-PLUS WIFI', 10990000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_b1717440', 'RAM-KINGSTON-FURY-BEAST-RGB-16GB-1X16GB-DDR5-6000M', 'RAM Kingston FURY Beast RGB 16GB (1x16GB) DDR5 6000Mhz (KF560C36BBE2A-16WP) (AMD EXPO+INTEL XMP)', 6990000, 10, 'RAM', '2026-10-08 02:50:38'),
('prd_b1c4c01f', 'MAN-HINH-SAMSUNG-ODYSSEY-G8-LS34BG850SEXXV', 'Màn hình Samsung Odyssey G8 LS34BG850SEXXV 34 inch OLED WQHD 175Hz', 21980000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_b1d00b5c', 'MAN-HINH-GAMING-VIEWSONIC-VX24G30-24-INCH-IPS-FHD-', 'Màn Hình Gaming ViewSonic VX24G30 (24 inch - IPS - FHD - 0.8ms - 240Hz)', 2690000, 10, 'Màn hình', '2026-10-08 02:50:38'),
('prd_b27bb9ca', 'MAN-HINH-LG-ULTRAGEAR-G6-27G610A-B', 'Màn Hình LG UltraGear G6 27G610A-B (27 inch - IPS - 2K - 200Hz - 1ms)', 5190000, 10, 'Màn hình', '2026-10-08 02:50:38'),
('prd_b33ad58c', 'O-CUNG-SSD-PATRIOT-P400-LITE-M-2-PCIE-GEN-4X4-NVME', 'Ổ cứng SSD Patriot P400 Lite M.2 PCIe Gen 4x4 NVMe 1TB', 4590000, 10, 'SSD', '2026-10-08 02:50:38'),
('prd_b41c674f', 'VO-MAY-TINH-XIGMATEK-WIND-M-ARCTIC', 'Vỏ máy tính Xigmatek WIND M Arctic', 940000, 10, 'Case', '2026-10-08 02:50:38'),
('prd_b43b233a', 'CARD-MAN-HINH-ASUS-TUF-GAMING-GEFORCE-RTX-5060-8GB', 'Card màn hình ASUS TUF Gaming GeForce RTX 5060 8GB GDDR7 OC Edition (TUF-RTX5060-O8G-GAMING)', 15990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_b449623e', 'TAN-NHIET-KHI-DEEPCOOL-AG400-G2-ARGB-WHITE', 'Tản nhiệt khí Deepcool AG400 G2 ARGB White', 450000, 10, 'Tản nhiệt', '2026-10-08 02:54:09'),
('prd_b48fc848', 'MAINBOARD-GIGABYTE-X870E-AORUS-PRO-ICE', 'Mainboard GIGABYTE X870E AORUS PRO ICE', 12580000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_b4abc76e', 'VO-CASE-ASUS-A21-BLACK-MATX-MAU-DEN', 'Vỏ Case ASUS A21 Black (Matx, Màu Đen)', 1290000, 10, 'Case', '2026-10-08 02:50:38'),
('prd_b574fe6f', 'MAN-HINH-SAMSUNG-ODYSSEY-G4-G40H-LS27HG400EEXXV', 'Màn Hình SAMSUNG Odyssey G4 G40H LS27HG400EEXXV (27 inch - IPS - FHD - 1ms - 300Hz)', 4990000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_b5c5c5ee', 'MAN-HINH-GAMING-SAMSUNG-ODYSSEY-G4-LS27BG400EEXXV', 'Màn hình Gaming SAMSUNG Odyssey G4 LS27BG400EEXXV (27 inch - FHD - IPS - 240Hz)', 3890000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_b5ddcd47', 'RAM-APACER-NOX-16GB-DDR5-BUS-5200MHZ-BLACK', 'RAM APACER NOX 16GB DDR5 bus 5200Mhz – Black', 5390000, 10, 'RAM', '2026-10-08 02:53:41'),
('prd_b6b50f36', 'TAN-NHIET-NUOC-SSTC-AIO-SHARK-SOLUTION-360', 'TẢN NHIỆT NƯỚC SSTC AIO SHARK SOLUTION 360 (SSTC-WC360ARGB)', 990000, 10, 'Tản nhiệt', '2026-10-08 02:50:38'),
('prd_b6b9637b', 'MAN-HINH-LG-ULTRAGEAR-G4-24G411A-B', 'Màn Hình LG UltraGear G4 24G411A-B (23,8 inch - IPS - FHD - 144Hz - 5ms)', 2690000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_b6ca8f3a', 'RAM-GSKILL-FLARE-X5-DDR5-32GB-2X16GB-BUS-6000-MHZ-', 'Ram GSkill Flare X5 DDR5 32GB ( 2x16GB ) Bus 6000 MHz (CL36 F5-6000J3648D16GX2-FX5 )( Expo/ XMP )', 12990000, 10, 'RAM', '2026-10-08 02:50:38'),
('prd_b6e97f2f', 'MAN-HINH-ASUS-VY279HGR', 'Màn Hình ASUS VY279HGR (27 inch - IPS - FHD - 120Hz - 1ms)', 2790000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_b6fd6284', 'NGUON-FSP-HV-PRO-650W-80-PLUS-BRONZE-DAY-LIEN-EU-D', 'Nguồn FSP HV PRO 650W  (80 Plus Bronze/DÂY LIỀN/EU/ĐEN (PPA6505403))', 1190000, 10, 'PSU', '2026-10-08 02:54:09'),
('prd_b818513f', 'NGUON-MAY-TINH-GIGABYTE-P750BS-750W-80-PLUS-BRONZE', 'Nguồn máy tính Gigabyte P750BS 750W (80 Plus Bronze, GP-P750BS)', 1590000, 10, 'PSU', '2026-10-08 02:54:09'),
('prd_b99e0975', 'VO-CASE-GAMDIAS-ATLAS-M3M-CAATLASM3MBLGA', 'VỎ CASE GAMDIAS ATLAS M3M CAATLASM3MBLGA (Micro-Tower, Black)', 1850000, 10, 'Case', '2026-10-08 02:50:38'),
('prd_bc3a5eea', 'MAN-HINH-DELL-ULTRASHARP-U3425WE', 'Màn Hình Dell UltraSharp U3425WE (34.14 inch - IPS - QHD - 5ms - 120Hz)', 22590000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_bde51b94', 'MAN-HINH-SAMSUNG-ODYSSEY-OLED-G6-G60SF-LS27FG602SE', 'Màn Hình SAMSUNG Odyssey OLED G6 G60SF LS27FG602SEXXV (27 inch - OLED - 2K - 500Hz - 0.03ms)', 21990000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_be25b52b', 'TAN-NHIET-NUOC-AIO-EINAREX-VERTEX-LITE-360MM-BLACK', 'Tản nhiệt nước AIO EINAREX VERTEX LITE 360mm Black', 1590000, 10, 'Tản nhiệt', '2026-10-08 02:50:38'),
('prd_be3ad708', 'CARD-MAN-HINH-MSI-GEFORCE-RTX-5090-32G-VENTUS-3X-O', 'Card màn hình MSI GeForce RTX 5090 32G VENTUS 3X OC', 189990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_be5217db', 'CPU-AMD-RYZEN-9-7900X-TRAY', 'CPU AMD RYZEN 9 7900X  - TRAY NEW (4.7 GHZ UPTO 5.6GHZ / 76MB / 12 CORES, 24 THREADS / 170W / AM5)', 8990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_be88b5bd', 'MAN-HINH-MAY-TINH-VIOX-MF2425-V', 'Màn hình máy tính VIOX MF2425-V (24inch / IPS / FHD / 100Hz / 1Ms)', 1790000, 10, 'Màn hình', '2026-10-08 02:54:10'),
('prd_be8aa9e0', 'MAN-HINH-LG-27MS570B-B', 'Màn Hình LG 27MS570B-B (27 inch - IPS - FHD - 100Hz - 5ms - Speaker - USB Type C )', 3590000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_bed45132', 'CARD-MAN-HINH-GIGABYTE-AORUS-RX-9070-XT-16G-ELITE', 'Card màn hình GIGABYTE AORUS RX 9070 XT 16G ELITE (GV-R9070XTAORUS E-16GD)', 25990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_bee67705', 'CPU-INTEL-CORE-I5-14400-TRAY', 'CPU Intel Core I5 14400 - Tray (Up To 4.70GHz, 10 Nhân 16 Luồng, 20MB Cache, LGA 1700)', 4990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_bf1a244a', 'CARD-MAN-HINH-GIGABYTE-GEFORCE-RTX-5060-TI-EAGLE-O', 'Card màn hình GIGABYTE GeForce RTX 5060 Ti EAGLE OC ICE 16GB', 22990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_c00b4682', 'MAN-HINH-GAMING-GIGABYTE-GS24F14', 'Màn Hình Gaming GIGABYTE GS24F14 (23.8 inch - IPS - FHD - 144Hz - 1ms)', 2090000, 10, 'Màn hình', '2026-10-08 02:50:38'),
('prd_c03a8855', 'CARD-MAN-HINH-MSI-RTX-5070-TI-16GB-SHADOW-3X-OC', 'Card màn hình MSI RTX 5070 Ti 16GB SHADOW 3X OC', 37990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_c09d7d45', 'O-CUNG-SSD-KIOXIA-EXCERIA-PLUS-G4-1TB-M-2-PCIE-GEN', 'Ổ cứng SSD Kioxia Exceria Plus G4 1TB M.2 PCIe Gen5 x4 (Đọc 10000MB/s - Ghi 7900MB/s)', 7790000, 10, 'SSD', '2026-10-08 02:50:38'),
('prd_c145404d', 'TAN-NHIET-NUOC-GAMDIAS-AURA-GL360-V2-ARGB-BLACK', 'Tản nhiệt nước Gamdias AURA GL360 V2 ARGB BLACK (WAAURAGL360V2BLGA)', 1690000, 10, 'Tản nhiệt', '2026-10-08 02:50:38'),
('prd_c1c46d83', 'CARD-MAN-HINH-ASUS-PRIME-RTX-5070-WHITE-OC-EDITION', 'Card màn hình ASUS PRIME RTX 5070 White OC Edition 12GB GDDR7 (PRIME-RTX5070-O12G-WHITE)', 28990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_c1c66888', 'CARD-MAN-HINH-ZOTAC-GAMING-GEFORCE-RTX-5070-SOLID', 'Card màn hình ZOTAC GAMING GeForce RTX 5070 SOLID OC 12GB', 26990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_c2dc6256', 'MAN-HINH-DELL-ULTRASHARP-U2724D-27-INCH-QHD-IPS-12', 'Màn hình Dell Ultrasharp U2724D (27 inch/QHD/IPS/120Hz/5ms/USB-C)', 9490000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_c33a348f', 'O-CUNG-SSD-SAMSUNG-990-EVO-PLUS-1TB-PCIE-4-0-X4-PC', 'Ổ cứng  SSD Samsung 990 EVO Plus 1TB PCIe 4.0 x4 / PCIe 5.0 x2 NVMe V-NAND M.2 2280 MZ-V9S1T0BW', 7690000, 10, 'SSD', '2026-10-08 02:53:42'),
('prd_c458eec2', 'MAINBOARD-GIGABYTE-Z890-AORUS-ELITE-WIFI7-PLUS-DDR', 'Mainboard Gigabyte Z890 AORUS ELITE WIFI7 Plus DDR5 (Wifi+Bluetooth+Thunderbolt 4)', 7790000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_c463d628', 'TAN-NHIET-KHI-NOCTUA-NH-D15-CHROMAX-BLACK', 'Tản nhiệt khí NOCTUA NH-D15 Chromax Black', 3599000, 10, 'Tản nhiệt', '2026-10-08 02:54:09'),
('prd_c566cbfa', 'RAM-ADATA-XPG-LANCER-BLADE-BLACK-32GB-2X16GB-DDR5-', 'RAM Adata XPG Lancer Blade Black 32GB (2x16GB) DDR5 5600MHz (AX5U5600C4616G-DTLABBK)', 13990000, 10, 'RAM', '2026-10-08 02:53:41'),
('prd_c5edc048', 'VO-MAY-TINH-XIGMATEK-WIND-M', 'Vỏ máy tính Xigmatek WIND M', 890000, 10, 'Case', '2026-10-08 02:50:38'),
('prd_c6819585', 'CARD-MAN-HINH-GIGABYTE-GEFORCE-RTX-5050-GAMING-OC-', 'Card màn hình  Gigabyte GeForce RTX 5050 GAMING OC 8G (GV-N5050GAMING OC-8GD)', 12990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_c6ee221a', 'RAM-ADATA-XPG-LANCER-BLADE-WHITE-32GB-2X16GB-DDR5-', 'RAM Adata XPG Lancer Blade White 32GB (2x16GB) DDR5 5600MHz (AX5U5600C4616G-DTLABWH)', 13990000, 10, 'RAM', '2026-10-08 02:50:38'),
('prd_c8f30df6', 'NGUON-MAY-TINH-SUPERFLOWER-LEADEX-VII-XG-1300W-ATX', 'Nguồn máy tính SuperFlower Leadex VII XG 1300W ATX3.1 80 Plus Gold SF-1300F14XG', 5690000, 10, 'PSU', '2026-10-08 02:50:38'),
('prd_c9777b9b', 'MAINBOARD-MSI-MAG-Z890-TOMAHAWK-WIFI-DDR5', 'Mainboard MSI MAG Z890 TOMAHAWK WIFI DDR5', 9299000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_ca152530', 'CPU-INTEL-CORE-ULTRA-7-270K-PLUS', 'CPU Intel Core Ultra 7 270K Plus (24 Nhân 24 Luồng , Up 5.5GHz)', 10590000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_ca56db7c', 'CARD-MAN-HINH-MSI-GEFORCE-RTX-5090-LIGHTNING-Z-32G', 'Card màn hình MSI GeForce RTX 5090 LIGHTNING Z 32GB GDDR7', 199990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_cad33839', 'CPU-INTEL-CORE-ULTRA-9-285K', 'CPU Intel Core Ultra 9 285K (Up to 5.7GHz , 24 nhân - 24 luồng ,36MB Cache, Arrow Lake -S)', 15990000, 10, 'CPU', '2026-10-08 02:50:38'),
('prd_cb947fd6', 'MAINBOARD-ASUS-ROG-STRIX-X870-A-GAMING-WIFI', 'Mainboard ASUS ROG STRIX X870-A GAMING WIFI', 12980000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_cc60bef8', 'MAINBOARD-ASUS-B760M-AYW-WIFI-DDR5', 'Mainboard Asus B760M-AYW WIFI DDR5', 3290000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_cc879f4f', 'MAINBOARD-MSI-MEG-X870E-GODLIKE-MAX-DDR5', 'Mainboard MSI MEG X870E GODLIKE MAX DDR5', 30990000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_ccae4d23', 'MAN-HINH-DELL-27-SE2725HM', 'Màn Hình Dell 27 SE2725HM (27 inch - IPS - FHD - 100Hz - 5ms)', 3590000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_ce1af4d1', 'TAN-NHIET-NUOC-JONSBO-TM-360-BLACK', 'TẢN NHIỆT NƯỚC JONSBO TM-360 BLACK', 2950000, 10, 'Tản nhiệt', '2026-10-08 02:50:38'),
('prd_cfe4b10f', 'NGUON-MAY-TINH-SUPERFLOWER-LEADEX-2800W-ATX-3-1-CY', 'Nguồn máy tính SuperFlower LEADEX  2800W ATX 3.1| Cybenetics Titanium (SF-2800F14HP)', 19050000, 10, 'PSU', '2026-10-08 02:50:38'),
('prd_d035d76c', 'CPU-INTEL-CORE-I3-12100F-TRAY', 'CPU Intel Core i3 12100F - TRAY NEW (3.3GHz Turbo 4.3GHz / 4 Nhân 8 Luồng / 12MB / LGA 1700)', 2990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_d192bfbe', 'CPU-AMD-RYZEN-9-9950X3D2', 'CPU AMD Ryzen 9 9950X3D2 Dual Edition (Up to 5.6GHz | 16 Cores Zen5 | 192 MB Cache)', 28990000, 10, 'CPU', '2026-10-08 02:50:38'),
('prd_d33dc568', 'CARD-MAN-HINH-GIGABYTE-GEFORCE-RTX-5070-EAGLE-OC-S', 'Card màn hình GIGABYTE GeForce RTX 5070 EAGLE OC SFF 12GB', 25990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_d39fde7d', 'TAN-NHIET-NUOC-AIO-LIAN-LI-HYDROSHIFT-II-OLED-CURV', 'Tản nhiệt nước AIO Lian Li HydroShift II OLED Curved 360TL White', 8990000, 10, 'Tản nhiệt', '2026-10-08 02:50:38'),
('prd_d3d6b1c1', 'MAINBOARD-ASUS-ROG-CROSSHAIR-X870E-GLACIAL', 'Mainboard ASUS ROG CROSSHAIR X870E GLACIAL', 39990000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_d4175de3', 'MAINBOARD-ASUS-PRIME-B860M-A-CSM', 'Mainboard ASUS PRIME B860M-A-CSM', 5299000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_d4fb2bb9', 'RAM-SSTC-16GB-BUS-3200MHZ-DDR4-XMP-EXPO-TAN-NHIET', 'Ram SSTC 16GB Bus 3200Mhz DDR4 BLACK TẢN NHIỆT	(FOR INTEL)', 2590000, 10, 'RAM', '2026-10-08 02:50:38'),
('prd_d50078e4', 'MAINBOARD-ASROCK-B650M-PRO-RS-WIFI-DDR5', 'Mainboard ASROCK B650M Pro RS WIFI DDR5', 4099000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_d53a5761', 'MAINBOARD-ASROCK-X870-RIPTIDE-WIFI', 'Mainboard ASRock X870 Riptide Wifi', 9499000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_d63af4d7', 'TAN-NHIET-NUOC-AIO-EINAREX-ORBIT-LITE-360-BLACK', 'TẢN NHIỆT NƯỚC AIO EINAREX ORBIT LITE 360 BLACK', 1790000, 10, 'Tản nhiệt', '2026-10-08 02:50:38'),
('prd_d72295e9', 'VO-CASE-GAMDIAS-ATLAS-M4-4-FAN-ARGB-MID-TOWER-MAU-', 'Vỏ Case Gamdias ATLAS M4 - 4 FAN ARGB (Mid Tower/ Màu Đen)', 2090000, 10, 'Case', '2026-10-08 02:50:38'),
('prd_d7428057', 'MAINBOARD-GIGABYTE-B860M-GAMING-X-WIFI-6E', 'Mainboard Gigabyte B860M GAMING X WIFI 6E', 5399000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_d81c60fc', 'VO-MAY-TINH-JONSBO-D33-BLACK', 'Vỏ máy tính JONSBO D33 BLACK (Mini Tower/ M-ATX/ Đen)', 1990000, 10, 'Case', '2026-10-08 02:50:38'),
('prd_d8abad49', 'RAM-CORSAIR-VENGEANCE-RGB-64GB-2X32GB-DDR5-6000MHZ', 'RAM CORSAIR VENGEANCE RGB 64GB (2x32GB) DDR5 6000Mhz (CMH64GX5M2B6000C38)', 29990000, 10, 'RAM', '2026-10-08 02:53:41'),
('prd_db3d9df7', 'CPU-INTEL-CORE-I7-14700F-TRAY', 'CPU INTEL CORE I7-14700F - TRAY (UP TO 5.4GHZ, 20 NHÂN 28 LUỒNG, 33MB CACHE, 65W)', 8990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_db41453d', 'TAN-NHIET-NUOC-GAMDIAS-CHIONE-P5-360-ARGB-WHITE', 'Tản nhiệt nước Gamdias CHIONE P5-360 ARGB WHITE (WCCNEP5360WHGA)', 3990000, 10, 'Tản nhiệt', '2026-10-08 02:50:38'),
('prd_dc468e29', 'CPU-INTEL-CORE-I5-14500-TRAY', 'CPU Intel Core i5 14500 - TRAY NEW (Up To 5.0GHz, 14 Nhân 20 Luồng, 24MB Cache, LGA 1700)', 5980000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_de397317', 'MAINBOARD-ASROCK-B650M-PRO-RS-DDR5', 'Mainboard ASRock B650M Pro RS DDR5', 3690000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_de3c9795', 'MAN-HINH-GAMING-LG-ULTRAGEAR-GX8-32GX850A-B', 'Màn Hình Gaming LG UltraGear GX8 32GX850A-B (31.5 inch - OLED - 4K - 165Hz hoặc FHD 330Hz- 0.03ms)', 25990000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_debe5fa8', 'CARD-MAN-HINH-MSI-RTX-5060-TI-16GB-SHADOW-2X-OC-PL', 'Card màn hình MSI RTX 5060 Ti 16GB SHADOW 2X OC PLUS', 22990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_df69cf1a', 'CPU-AMD-RYZEN-5-5600X3D-TRAY', 'CPU AMD RYZEN 5 5600X3D - TRAY (6 CORES | 12 THREADS | UPTO 4.4GHz | 96MB CACHE | AM5)', 5990000, 10, 'CPU', '2026-10-08 02:50:38'),
('prd_df84bcac', 'CPU-AMD-RYZEN-5-5500X3D-TRAY', 'CPU AMD RYZEN 5 5500X3D - TRAY (6 nhân 12 luồng , Up to 4.2Ghz  , 96 MB Cache, AM4)', 5690000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_df8ba3c4', 'MAINBOARD-ASROCK-B550M-PRO4', 'Mainboard ASROCK B550M PRO4', 2690000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_e1079693', 'MAINBOARD-MSI-MEG-Z890-ACE', 'Mainboard MSI MEG Z890 ACE (Intel Z890, Socket 1851, ATX, RAM DDR5)', 21499000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_e1347d53', 'CARD-MAN-HINH-INNO3D-GEFORCE-RTX-3060-TWIN-X2-12GB', 'Card màn hình  INNO3D GEFORCE RTX 3060 TWIN X2 12GB GDDR6', 10990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_e16681cb', 'CARD-MAN-HINH-ASUS-DUAL-RADEON-RX-9060-XT-16GB', 'Card màn hình ASUS Dual Radeon RX 9060 XT 16GB', 14980000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_e1c38fd5', 'CPU-AMD-RYZEN-5-9600X-TRAY', 'CPU AMD Ryzen 5 9600X - TRAY (3.9 GHz Boost 5.4 GHz | 6 nhân/ 12 luồng | 32 MB Cache)', 6980000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_e22174af', 'CARD-MAN-HINH-MSI-GEFORCE-RTX-5050-8GB-GAMING-OC', 'Card màn hình MSI GeForce RTX 5050 8GB GAMING OC', 10990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_e2b1a8d8', 'MAINBOARD-ASUS-TUF-GAMING-B860M-PLUS', 'Mainboard Asus TUF GAMING B860M-PLUS', 6499000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_e2c07b4d', 'TAN-NHIET-NUOC-GAMDIAS-CHIONE-P5-240-ARGB-BLACK', 'Tản nhiệt nước Gamdias CHIONE P5-240 ARGB BLACK (WCCNEP5240BLGA)', 3490000, 10, 'Tản nhiệt', '2026-10-08 02:50:38'),
('prd_e410ac33', 'CPU-AMD-RYZEN-5-5500GT', 'CPU AMD Ryzen 5 5500GT (4.4 GHz Upto 3.6 GHz / 19MB / 6 Cores, 12 Threads / 65W / Socket AM4)', 3890000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_e419110b', 'MAINBOARD-ASROCK-X870E-NOVA-WIFI', 'Mainboard ASRock X870E Nova Wifi DDR5', 10990000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_e4762ec4', 'CARD-MAN-HINH-GIGABYTE-GEFORCE-RTX-5070-GAMING-OC-', 'Card màn hình GIGABYTE GeForce RTX 5070 GAMING OC 12GB GDDR7', 26990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_e4a4dc09', 'MAN-HINH-MSI-PRO-MP251-E14L-24-5-INCH-IPS-FHD-144H', 'Màn Hình MSI PRO MP251 E14L (24.5 inch - IPS - FHD - 144Hz - 1ms)', 2190000, 10, 'Màn hình', '2026-10-08 02:54:10'),
('prd_e4e0258c', 'CARD-MAN-HINH-INNO3D-GEFORCE-RTX-5080-X3-16GB-GDDR', 'Card màn hình INNO3D GeForce RTX 5080 X3 16GB GDDR7', 47990000, 10, 'VGA', '2026-10-08 02:50:38'),
('prd_e5b584b5', 'VO-CASE-XIGMATEK-DYNAMIC-ML-EN91134', 'Vỏ case XIGMATEK DYNAMIC ML - EN91134', 890000, 10, 'Case', '2026-10-08 02:50:38'),
('prd_e5bdba86', 'JGINYUE-NVIDIA-GEFORCE-RTX-3060-BLACK-DUAL-FAN', 'Card màn hình JGINYUE NVIDIA GeForce RTX 3060 BLACK DUAL FAN', 10990000, 10, 'VGA', '2026-10-08 02:50:38'),
('prd_e66d51a7', 'CARD-MAN-HINH-COLORFUL-IGAME-GEFORCE-RTX-5080-ULTR', 'Card Màn Hình Colorful IGame GeForce RTX 5080 ULTRA OC 16GB-V', 49990000, 10, 'VGA', '2026-10-08 02:50:38'),
('prd_e682f2c3', 'MAN-HINH-MSI-MAG-272F-X24-27-INCH-IPS-FHD-240HZ-0-', 'Màn Hình MSI MAG 272F X24 (27 inch - IPS - FHD - 240Hz - 0.5ms)', 3390000, 10, 'Màn hình', '2026-10-08 02:50:38'),
('prd_e714cfb1', 'CARD-MAN-HINH-MSI-GEFORCE-RTX-3050-VENTUS-2X-XS-8G', 'Card màn hình MSI GeForce RTX 3050 VENTUS 2X XS 8G OC', 6890000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_e76e3b85', 'MAINBOARD-GIGABYTE-B850M-AORUS-ELITE-WIFI-6E-ICE', 'Mainboard Gigabyte B850M AORUS ELITE WIFI 6E ICE', 6990000, 10, 'Mainboard', '2026-10-08 02:50:38'),
('prd_e864f457', 'MAINBOARD-GIGABYTE-B860M-DS3H-DDR5', 'Mainboard Gigabyte B860M DS3H DDR5', 4299000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_e90a990f', 'MAN-HINH-GAMING-DELL-G2722HS-27-INCH-FHD-IPS-165HZ', 'Màn hình Gaming Dell G2722HS (27 inch/FHD/IPS/165Hz/1ms)', 3860000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_e9a7633d', 'O-CUNG-SSD-HIKSEMI-WAVE-1TB-M-2-2280-PCIE-3-0X4-DO', 'Ổ cứng SSD HIKSEMI WAVE 1TB M.2 2280 PCIe 3.0x4 (Đọc 2450MB/s, Ghi 2450MB/s)', 4290000, 10, 'SSD', '2026-10-08 02:50:38'),
('prd_e9d26cd5', 'MAINBOARD-MSI-A520M-A-PRO-DDR4', 'Mainboard MSI A520M-A PRO DDR4', 1590000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_e9ed8cd9', 'MAN-HINH-DARK-FLASH-G243FW-23-8-INCH-FHD-IPS-100HZ', 'Màn hình Dark Flash G243FW (23.8 inch/FHD/IPS/100Hz/5ms)', 1790000, 10, 'Màn hình', '2026-10-08 02:54:10'),
('prd_ea40c9bf', 'CARD-MAN-HINH-ZOTAC-GAMING-GEFORCE-RTX-5060-TWIN-E', 'Card màn hình ZOTAC GAMING GeForce RTX 5060 8GB Twin Edge OC', 14990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_ead1dc44', 'MAINBOARD-SAPPHIRE-PULSE-B850M-WIFI-DDR5', 'Mainboard Sapphire PULSE B850M WIFI DDR5', 4890000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_eb29d36f', 'O-CUNG-SSD-TEAMGROUP-NV5000-1TB-M-2-PCIE-NVME-GEN4', 'Ổ cứng SSD TeamGroup NV5000 1TB M.2 PCIe NVMe Gen4x4 (4,500 MB/s - 1,900 MB/s)', 4490000, 10, 'SSD', '2026-10-08 02:50:38'),
('prd_ec939475', 'MAN-HINH-GAMING-LG-ULTRAGEAR-45GX950A-B', 'Màn Hình Gaming LG UltraGear 45GX950A-B (44.5 inch - OLED - 165Hz - 0.03ms - Chế độ kép 5K 2K- Speaker - Cong)', 50460000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_ed2d8a80', 'CARD-MAN-HINH-GIGABYTE-RTX-5060-WINDFORCE-MAX-OC-8', 'Card màn hình Gigabyte RTX 5060 WINDFORCE MAX OC 8GB', 14990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_ed7dc907', 'TAN-NHIET-KHI-JONSBO-CR-1200', 'TẢN NHIỆT KHÍ JONSBO CR-1200 ( KÈM SẴN BACKPLATE 1700 JONSBO )', 250000, 10, 'Tản nhiệt', '2026-10-08 02:54:09'),
('prd_edc151c6', 'CPU-AMD-RYZEN-9-9950X3D', 'CPU AMD Ryzen 9 9950X3D (16 nhân 32 luồng, up to 5.7GHz ,144MB Cache , AM5)', 20990000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_ee6c8674', 'CARD-MAN-HINH-ASUS-TUF-GAMING-GEFORCE-RTX-5080-16G', 'Card màn hình ASUS TUF Gaming GeForce RTX 5080 16GB GDDR7 OC', 55990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_eff10c98', 'O-CUNG-SSD-KINGSTON-NV3-500GB-PCIE-4-0X4', 'Ổ cứng SSD Kingston NV3 500GB PCIe 4.0 x4 M.2 NVMe (SNV3S/500G)', 3290000, 10, 'SSD', '2026-10-08 02:50:38'),
('prd_f019108a', 'MAINBOARD-ASUS-TUF-GAMING-B650M-PLUS', 'Mainboard ASUS TUF GAMING B650M-PLUS', 4999000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_f091589b', 'MAINBOARD-ASUS-B760M-AYW-WIFI-DDR4', 'Mainboard Asus B760M-AYW WIFI DDR4', 3190000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_f0993e66', 'MAN-HINH-DELL-PRO-E2726HS', 'Màn Hình Dell Pro E2726HS (27.0 inch - IPS - FHD - 100Hz - 5ms -speaker)', 3690000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_f1f6e904', 'MAINBOARD-ASUS-PRIME-Z890M-PLUS-WIFI', 'Mainboard ASUS PRIME Z890M-PLUS WIFI', 6890000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_f233715d', 'MAINBOARD-GIGABYTE-X870M-AORUS-ELITE-WIFI7-ICE', 'Mainboard Gigabyte X870M AORUS ELITE WIFI7 ICE', 7290000, 10, 'Mainboard', '2026-10-08 02:50:38'),
('prd_f2947885', 'MAINBOARD-ASUS-ROG-STRIX-B850-F-GAMING-WIFI', 'Mainboard ASUS ROG STRIX B850-F GAMING WIFI', 9790000, 10, 'Mainboard', '2026-10-08 02:50:38'),
('prd_f2d13399', 'RAM-CORSAIR-VENGEANCE-RGB-32GB-2X16GB-DDR5-BUS-600', 'Ram Corsair VENGEANCE RGB 32GB (2x16GB) DDR5 bus 6000MHz Black (CMH32GX5M2E6000C36)', 13990000, 10, 'RAM', '2026-10-08 02:53:41'),
('prd_f2d43786', 'MAINBOARD-ASROCK-Z890-PRO-RS-WIFI-DDR5', 'Mainboard ASROCK Z890 PRO RS WIFI DDR5', 8099000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_f2e84588', 'MAINBOARD-COLORFUL-BATTLE-AX-B760M-PLUS-WIFI-V21-D', 'Mainboard Colorful BATTLE-AX B760M-PLUS WIFI V21 DDR4', 3290000, 10, 'Mainboard', '2026-10-08 02:50:38'),
('prd_f3358464', 'MAINBOARD-ASUS-ROG-B650E-E-GAMING-WIFI', 'Mainboard ASUS ROG B650E-E GAMING WIFI', 9899000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_f4186bf9', 'O-CUNG-SSD-SSTC-M100-512GB', 'Ổ cứng SSD SSTC M100 512GB | SATA III, 2.5\"', 1990000, 10, 'SSD', '2026-10-08 02:50:38'),
('prd_f42c5d14', 'O-CUNG-SSD-KINGSTON-NV3-2TB-PCIE-4-0-X4-M-2-NVME', 'Ổ cứng SSD Kingston NV3 2TB PCIe 4.0 x4 M.2 NVMe', 8990000, 10, 'SSD', '2026-10-08 02:50:38'),
('prd_f477dd32', 'CARD-MAN-HINH-COLORFUL-IGAME-GEFORCE-RTX-3050-ULTR', 'Card màn hình Colorful iGame GeForce RTX 3050 Ultra W DUO OC V2 8GB-V', 7990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_f57965b7', 'MAINBOARD-ASUS-TUF-GAMING-B650EM-E-WIFI-DDR5', 'Mainboard Asus TUF GAMING B650EM-E WIFI DDR5', 4590000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_f6139bf0', 'TAN-NHIET-KHI-DEEPCOOL-AG400-G2-ARGB', 'Tản nhiệt khí Deepcool AG400 G2 ARGB', 450000, 10, 'Tản nhiệt', '2026-10-08 02:54:09'),
('prd_f6611c58', 'CARD-MAN-HINH-INNO3D-GEFORCE-RTX-5060-TI-16GB-TWIN', 'Card màn hình INNO3D GeForce RTX 5060 Ti 16GB Twin X2', 22990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_f786af0b', 'CARD-MAN-HINH-GIGABYTE-GEFORCE-RTX-5070-AERO-OC-12', 'Card màn hình GIGABYTE GeForce RTX 5070 AERO OC 12GB', 29990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_f7e2a5b8', 'MAINBOARD-GIGABYTE-Z890M-AORUS-ELITE-WIFI7', 'Mainboard GIGABYTE Z890M AORUS ELITE WIFI7', 6490000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_f87faf79', 'CARD-MAN-HINH-COLORFUL-IGAME-GEFORCE-RTX-5060-ULTR', 'Card màn hình Colorful iGame GeForce RTX 5060 Ultra W OC 8GB-V', 15990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_f8de9544', 'RAM-ADATA-XPG-LANCER-BLADE-RGB-DDR5-16GB-6000MHZ-B', 'RAM Adata XPG Lancer Blade RGB DDR5 16GB 6000MHz Black (AX5U6000C3016G-SLABRBK)', 6990000, 10, 'RAM', '2026-10-08 02:50:38'),
('prd_f95cde75', 'CPU-INTEL-CORE-ULTRA-5-250K-PLUS-TRAY', 'CPU Intel Core Ultra 5 250K Plus - TRAY (Upto 5.3 GHz, 18 Nhân 18 Luồng, 30MB Cache, LGA 1851/ARROW LAKE)', 7890000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_f9b84eb6', 'MAN-HINH-ASUS-TUF-GAMING-VG249Q3R-24-INCH-FHD-IPS-', 'Màn hình  Asus TUF Gaming VG249Q3R (24 Inch/ FHD/ IPS/ 180Hz/ 1ms)', 2880000, 10, 'Màn hình', '2026-10-08 02:50:38'),
('prd_fa21a72a', 'NGUON-MAY-TINH-EINAREX-AXIS-MASTER-L1-650W-80-PLUS', 'Nguồn máy tính Einarex AXIS MASTER L1 650W 80 Plus Bronze Semi-Modular', 1190000, 10, 'PSU', '2026-10-08 02:54:09'),
('prd_fa699f46', 'RAM-TEAMGROUP-ELITE-PLUS-16GB-DDR4-BUS-3200MHZ-TPD', 'Ram TeamGroup Elite Plus 16GB DDR4 Bus 3200Mhz (TPD416G3200HC22BK)', 2890000, 10, 'RAM', '2026-10-08 02:53:41'),
('prd_fa9401ff', 'MAINBOARD-MSI-MPG-Z890-EDGE-TI-WIFI-DDR5', 'Mainboard MSI MPG Z890 EDGE TI WIFI DDR5', 11990000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_faeb5e94', 'MAN-HINH-MSI-MAG-245F-X24-23-8-INCH-IPS-FHD-240HZ-', 'Màn Hình MSI MAG 245F X24 (23.8 inch - IPS - FHD - 240Hz - 0.5ms)', 2890000, 10, 'Màn hình', '2026-10-08 02:50:38'),
('prd_fb671eac', 'NGUON-MAY-TINH-AIGO-GB650-650W-80-PLUS-BRONZE-MAU-', 'Nguồn máy tính AIGO GB650 - 650W (80 Plus Bronze/Màu Đen)', 1190000, 10, 'PSU', '2026-10-08 02:54:09'),
('prd_fbb45f0e', 'MAN-HINH-ASUS-VP227HF-21-45-INCH-VA-FHD-100HZ-1MS', 'Màn Hình ASUS VP227HF (21.45 inch - VA - FHD - 100Hz - 1ms)', 1860000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_fbb77440', 'MAINBOARD-ASUS-ROG-STRIX-B650-A-GAMING-WIFI-DDR5', 'Mainboard Asus ROG STRIX B650-A GAMING WIFI DDR5', 7799000, 10, 'Mainboard', '2026-10-08 02:52:52'),
('prd_fbf72288', 'CARD-MAN-HINH-COLORFUL-IGAME-GEFORCE-RTX-5060-TI-U', 'Card Màn Hình Colorful iGame GeForce RTX 5060 Ti Ultra W DUO OC 16GB-V', 22990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_fc4dca24', 'CARD-MAN-HINH-GIGABYTE-GEFORCE-RTX-3050-WINDFORCE-', 'Card màn hình Gigabyte GeForce RTX 3050 WINDFORCE OC V2 8GB (N3050WF2OCV2-8GD)', 7990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_fcb6e9af', 'CARD-MAN-HINH-ASL-RTX-3060-LHR-12GB-GDDR6', 'Card Màn Hình ASL RTX 3060 LHR 12GB GDDR6', 10990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_fd479641', 'MAN-HINH-SAMSUNG-S32GF-LS24F320GAEXXV-24-INCH-IPS-', 'Màn Hình SAMSUNG S32GF LS24F320GAEXXV (24 inch - IPS - FHD - 120Hz - 5ms)', 2130000, 10, 'Màn hình', '2026-10-08 02:54:09'),
('prd_fd61708a', 'CARD-MAN-HINH-MSI-GEFORCE-RTX-5080-16G-VENTUS-3X-O', 'Card màn hình MSI GeForce RTX 5080 16G VENTUS 3X OC PLUS', 47990000, 10, 'VGA', '2026-10-08 02:50:38'),
('prd_fe5f9041', 'CPU-INTEL-CORE-ULTRA-7-265KF', 'CPU Intel Core Ultra 7 265KF (Up to 5.5GHz , 20 nhân - 20 luồng ,30MB Cache, Arrow Lake -S)', 9890000, 10, 'CPU', '2026-10-08 02:50:38'),
('prd_fed318c2', 'CPU-AMD-RYZEN-5-3400G-TRAY', 'CPU AMD Ryzen 5 3400G - TRAY (3.7 GHz Upto 4.2 GHz / 6MB / 4 Cores, 8 Threads / Radeon Vega 11 / 65W / Socket AM4)', 2190000, 10, 'CPU', '2026-10-08 02:52:22'),
('prd_ff0a7e4d', 'CARD-MAN-HINH-ASUS-ROG-ASTRAL-GEFORCE-RTX-5090-32G', 'Card màn hình ASUS ROG Astral GeForce RTX 5090 32GB GDDR7 OC Edition', 199990000, 10, 'VGA', '2026-10-08 02:53:13'),
('prd_ff5055fe', 'MAINBOARD-GIGABYTE-Z890M-AORUS-ELITE-WIFI7-ICE', 'Mainboard GIGABYTE Z890M AORUS ELITE WIFI7 ICE', 6990000, 10, 'Mainboard', '2026-10-08 02:50:38'),
('prd_ff532ca1', 'NGUON-MAY-TINH-AIGO-VK650-650W-80-PLUS-ACTIVE-PFC-', 'NGUỒN MÁY TÍNH AIGO VK650 - 650W (80 PLUS/ ACTIVE PFC/ SINGLE RAIL)', 920000, 10, 'PSU', '2026-10-08 02:54:09'),
('prd_fff70250', 'RAM-DESKTOP-GSKILL-RIPJAWS-M5-RGB-WHITE-32GB-2X16G', 'Ram Desktop Gskill RIPJAWS M5 RGB WHITE  32GB (2x16GB) Bus 6000MHz  DDR5  (F5-6000J3648D16GX2-RM5RW)', 13990000, 10, 'RAM', '2026-10-08 02:53:41');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `schema_migrations`
--

CREATE TABLE `schema_migrations` (
  `name` varchar(255) NOT NULL,
  `applied_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `schema_migrations`
--

INSERT INTO `schema_migrations` (`name`, `applied_at`) VALUES
('0001_initial_schema.sql', '2026-10-08 01:46:02'),
('0003_auth_accounts.sql', '2026-10-08 01:46:02'),
('0004_simplify_password.sql', '2026-10-08 01:46:02'),
('0005_order_address_item_warranty.sql', '2026-10-08 01:46:02'),
('0006_user_roles.sql', '2026-10-08 01:46:02'),
('0007_drop_role_not_null.sql', '2026-10-08 01:46:02'),
('0008_security_indexes.sql', '2026-10-08 02:15:30'),
('0009_notifications.sql', '2026-10-08 03:47:12');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `user_agent` text DEFAULT NULL,
  `ip` varchar(64) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `last_seen_at` datetime NOT NULL DEFAULT current_timestamp(),
  `expires_at` varchar(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `user_agent`, `ip`, `created_at`, `last_seen_at`, `expires_at`) VALUES
('4T84RxI7Z4AVPWLB8tenONBcAaFPnqD4vgL2a9z7Vf8=', 'usr_nhatnd_muyjna49', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '::1', '2026-10-08 03:57:16', '2026-10-08 04:03:39', '2026-10-14T20:57:16.768Z'),
('JZo3Sth176CaWwyK6l7kheLA4en8lutBNAwzHFDOmho=', 'usr_admin_01', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', '::1', '2026-10-08 01:51:50', '2026-10-08 04:03:39', '2026-10-14T18:51:50.960Z');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `shipments`
--

CREATE TABLE `shipments` (
  `id` varchar(64) NOT NULL,
  `order_id` varchar(64) NOT NULL,
  `shipper_id` varchar(64) NOT NULL,
  `assigned_by_user_id` varchar(64) NOT NULL,
  `address` text NOT NULL,
  `distance_km` double NOT NULL,
  `km_source` varchar(32) NOT NULL CHECK (`km_source` in ('gg_map','manual')),
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `shipments`
--

INSERT INTO `shipments` (`id`, `order_id`, `shipper_id`, `assigned_by_user_id`, `address`, `distance_km`, `km_source`, `created_at`) VALUES
('ship_1791406596441_3yc14', 'ord_1791406335210_w1inf', 'usr_nhatnd_muyjna49', 'usr_huynq_muyjm9uj', 'Toà nhà Bitexco, 2 Hải Triều, Bến Nghé, Quận 1, TP. Hồ Chí Minh', 2.8, 'gg_map', '2026-10-08 03:56:36');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` varchar(64) NOT NULL,
  `name` text NOT NULL,
  `phone` text NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `role` varchar(32) DEFAULT NULL CHECK (`role` in ('admin','kinh_doanh','kho','ky_thuat','quan_ly_ky_thuat','bao_hanh','quan_ly_ship','shipper')),
  `is_active` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `username` varchar(255) DEFAULT NULL,
  `password_hash` text DEFAULT NULL,
  `last_login_at` text DEFAULT NULL,
  `failed_login_count` int(11) NOT NULL DEFAULT 0,
  `locked_until` text DEFAULT NULL,
  `updated_at` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `name`, `phone`, `email`, `role`, `is_active`, `created_at`, `username`, `password_hash`, `last_login_at`, `failed_login_count`, `locked_until`, `updated_at`) VALUES
('usr_admin_01', 'Administrator', '0901234567', 'admin@localhost', 'admin', 1, '2026-10-08 01:46:02', 'admin', 'pbkdf2_sha256$210000$U6XwfBR0hmjKHSWd0C9eLA==$78j0bfizulZtfcsARLPNTKvegrxzvL+243qemoSMkgg=', '2026-10-08 01:51:50', 0, NULL, '2026-10-08 01:51:50'),
('usr_congdt_muyjli8g', 'Đỗ Thành Công', '0123456789', NULL, NULL, 1, '2026-10-08 03:10:46', 'congdt', 'pbkdf2_sha256$210000$QyLPQGU9fdYwTd0l5VToqw==$EU+mbgF0CTq/5LushvpUpIl84piM4B/MhBUfQGZ4Tto=', '2026-10-08 03:54:40', 0, NULL, '2026-10-08 03:54:40'),
('usr_huynq_muyjm9uj', 'Nguyễn Quang Huy', '0123456789', NULL, NULL, 1, '2026-10-08 03:11:22', 'huynq', 'pbkdf2_sha256$210000$gJCkZa3gUv3RpPJwA9trXg==$B7vB0M04jz5jITfvc1ocKD5jy2wcBS5lXcw4aFFXNs4=', '2026-10-08 03:56:09', 0, NULL, '2026-10-08 03:56:09'),
('usr_nghitq_muyjico0', 'Trần Quang Nghị', '0123456789', NULL, NULL, 1, '2026-10-08 03:08:19', 'nghitq', 'pbkdf2_sha256$210000$B8pBdxVR82aU92jx0KjTug==$xNp01Y7Y2GhI1jZdFZZm+DMndciUJXZtzoJesrrXxvU=', '2026-10-08 03:55:16', 0, NULL, '2026-10-08 03:55:16'),
('usr_nhatnd_muyjna49', 'Nguyễn Đức Nhật', '0123456789', NULL, NULL, 1, '2026-10-08 03:12:09', 'nhatnd', 'pbkdf2_sha256$210000$WZaVpn0TCUoazWbhsCrHLw==$wXyuHif4wa4JCGnbiw6mDXSC2VKhDoU1wbIhUvQGOo4=', '2026-10-08 03:57:16', 0, NULL, '2026-10-08 03:57:16'),
('usr_tuannm_muyjjbfc', 'Nguyễn Mạnh Tuấn', '0123456789', NULL, NULL, 1, '2026-10-08 03:09:04', 'tuannm', 'pbkdf2_sha256$210000$HunyAeI64U1Z4IMMbISY4A==$ZpVQvkbYoBj+RSRPM7ufPOvxOTP7z4mTbpqvh33K4W8=', '2026-10-08 03:54:09', 0, NULL, '2026-10-08 03:54:09');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_roles`
--

CREATE TABLE `user_roles` (
  `user_id` varchar(64) NOT NULL,
  `role` varchar(32) NOT NULL CHECK (`role` in ('admin','kinh_doanh','kho','ky_thuat','quan_ly_ky_thuat','bao_hanh','quan_ly_ship','shipper'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `user_roles`
--

INSERT INTO `user_roles` (`user_id`, `role`) VALUES
('usr_admin_01', 'admin'),
('usr_congdt_muyjli8g', 'ky_thuat'),
('usr_huynq_muyjm9uj', 'quan_ly_ship'),
('usr_nghitq_muyjico0', 'kho'),
('usr_nhatnd_muyjna49', 'shipper'),
('usr_tuannm_muyjjbfc', 'kinh_doanh');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `auth_audit_log`
--
ALTER TABLE `auth_audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_auth_audit_created` (`created_at`),
  ADD KEY `idx_auth_audit_actor` (`actor_user_id`);

--
-- Chỉ mục cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_user` (`user_id`),
  ADD KEY `idx_notifications_user_read` (`user_id`,`is_read`),
  ADD KEY `idx_notifications_order` (`order_id`);

--
-- Chỉ mục cho bảng `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoice_no` (`invoice_no`),
  ADD KEY `idx_orders_status` (`status`),
  ADD KEY `idx_orders_sales` (`sales_user_id`),
  ADD KEY `idx_orders_invoice_date` (`invoice_date`(768)),
  ADD KEY `idx_orders_payment_status` (`payment_status`),
  ADD KEY `idx_orders_created` (`created_at`);

--
-- Chỉ mục cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_items_order` (`order_id`),
  ADD KEY `idx_order_items_product` (`product_id`);

--
-- Chỉ mục cho bảng `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_status_history_order` (`order_id`),
  ADD KEY `idx_order_history_created` (`created_at`);

--
-- Chỉ mục cho bảng `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_payments_order` (`order_id`);

--
-- Chỉ mục cho bảng `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD KEY `idx_products_name` (`name`(768));

--
-- Chỉ mục cho bảng `schema_migrations`
--
ALTER TABLE `schema_migrations`
  ADD PRIMARY KEY (`name`);

--
-- Chỉ mục cho bảng `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sessions_user` (`user_id`),
  ADD KEY `idx_sessions_expires` (`expires_at`);

--
-- Chỉ mục cho bảng `shipments`
--
ALTER TABLE `shipments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_shipments_order` (`order_id`),
  ADD KEY `idx_shipments_shipper` (`shipper_id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `idx_users_username` (`username`);

--
-- Chỉ mục cho bảng `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`user_id`,`role`),
  ADD KEY `idx_user_roles_user` (`user_id`),
  ADD KEY `idx_user_roles_role` (`role`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
