-- Migration 0004: Simplify password handling
-- 1. Drop the "forced password change" flag (nothing enforces it any more)
-- 2. Clear any account lockout left over from the previous policy
--
-- Password complexity is intentionally NOT enforced: any non-empty value
-- (max 128 chars) is accepted.

ALTER TABLE users DROP COLUMN must_change_password;

UPDATE users SET locked_until = NULL, failed_login_count = 0;
