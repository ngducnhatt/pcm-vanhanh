-- ============================================================
-- PCM Van Hanh - Tao database cho XAMPP (MySQL/MariaDB)
-- Cach dung 1 (phpMyAdmin): mo http://localhost/phpmyadmin
--   -> tab SQL -> copy/paste toan bo file nay -> Go
-- Cach dung 2 (MySQL client):
--   mysql -u root -p < scripts/create-database.sql
--   (bo -p neu root khong co mat khau: mysql -u root < scripts/create-database.sql)
-- ============================================================

CREATE DATABASE IF NOT EXISTS pcm_vanhanh
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS pcm_vanhanh_test
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
