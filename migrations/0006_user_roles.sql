-- Migration 0006: Cho phép 1 nhân viên có nhiều vai trò
-- Tạo bảng trung gian user_roles và migrate dữ liệu cũ

-- 1. Tạo bảng user_roles
CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  PRIMARY KEY (user_id, role)
);

-- 2. Migrate dữ liệu cũ từ cột role sang bảng user_roles
INSERT INTO user_roles (user_id, role)
SELECT id, role FROM users
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Tạo index để tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- 4. Giữ nguyên cột role trong users để tương thích ngược
-- (sẽ xóa trong migration tiếp theo nếu cần)
