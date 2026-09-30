-- Migration 0007: Bỏ NOT NULL constraint trên cột role trong bảng users
-- Vì roles đã chuyển sang bảng user_roles, cột role trong users chỉ để tương thích ngược

ALTER TABLE users ALTER COLUMN role DROP NOT NULL;
