-- Migration 0007: Bỏ NOT NULL constraint trên cột role trong bảng users
-- Vì roles đã chuyển sang bảng user_roles, cột role trong users chỉ để tương thích ngược

ALTER TABLE users MODIFY COLUMN role VARCHAR(32) NULL CHECK(role IN (
  'admin',
  'kinh_doanh',
  'kho',
  'ky_thuat',
  'quan_ly_ky_thuat',
  'bao_hanh',
  'quan_ly_ship',
  'shipper'
));
