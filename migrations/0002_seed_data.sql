-- Migration 0002: (đã bị gỡ khỏi repo) — file seed dữ liệu mẫu.
--
-- LỊCH SỬ: file `0002_seed_data.sql` từng chứa dữ liệu mẫu (user mẫu theo vai trò,
-- sản phẩm mẫu, đơn hàng mẫu ở các trạng thái). Nội dung đó dùng cú pháp SQLite
-- (`INSERT OR IGNORE`) nên KHÔNG chạy được trên MySQL/MariaDB, và file đã bị xóa
-- khỏi repo ở commit f92787a.
--
-- VÌ SAO CẦN FILE NÀY: `schema_migrations` lưu tên file đã áp dụng. Nếu DB cũ đã
-- từng chạy 0002 (hoặc DB được tạo từ bản seed SQLite cũ), tên `0002_seed_data.sql`
-- không có trong `migrations/` nên hệ thống không còn biết trạng thái của nó.
--
-- HÀNH ĐỘNG: file này là một "marker" rỗng — KHÔNG tạo bảng, KHÔNG chèn dữ liệu.
-- Nó chỉ đảm bảo chuỗi số 0002 không bị "bỏ trống" gây nhầm lẫn, và ghi lại
-- trong lịch sử rằng 0002 đã được xử lý (theo cách seed thủ công).
--
-- LƯU Ý: nếu DB của bạn CHƯA từng có dữ liệu mẫu, file này vẫn chạy an toàn.
-- Dữ liệu mẫu (nếu cần) nên được tạo bằng `npm run db:admin` + nhập tay trên UI,
-- không seed bằng SQL.

-- Marker không sinh dữ liệu. Câu lệnh duy nhất ở đây để MySQL không báo
-- "Query was empty" (error 1065) khi chạy file chỉ chứa comment.
SELECT 1;

