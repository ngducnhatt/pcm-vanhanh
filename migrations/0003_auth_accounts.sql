-- Migration 0003: Authentication & Account Management
-- Adds: username + password login, server-side sessions, account admin audit log.
--
-- NOTE: the `must_change_password` column added below is dropped again by
-- migration 0004 (forced password change was removed). The column is kept here
-- so that databases migrated through 0003 can still run 0004 cleanly.
--
-- 1. Extend users table -------------------------------------------------------
ALTER TABLE users ADD COLUMN username VARCHAR(255);
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN last_login_at TEXT;
ALTER TABLE users ADD COLUMN failed_login_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TEXT;
ALTER TABLE users ADD COLUMN updated_at TEXT;

-- Legacy accounts without a username cannot log in.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 2. Sessions ----------------------------------------------------------------
-- Only the SHA-256 digest of the cookie token is stored, so a database leak
-- cannot be replayed as a valid session.
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(64) PRIMARY KEY,          -- sha256(token from cookie)
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_agent TEXT,
  ip VARCHAR(64),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at VARCHAR(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- 3. Auth audit log -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_audit_log (
  id VARCHAR(64) PRIMARY KEY,
  actor_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  actor_name TEXT,
  action VARCHAR(64) NOT NULL,         -- login_success | login_failed | logout | user_created | ...
  target_user_id VARCHAR(64),
  target_name TEXT,
  detail TEXT,                         -- JSON payload
  ip VARCHAR(64),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_created ON auth_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_audit_actor ON auth_audit_log(actor_user_id);
