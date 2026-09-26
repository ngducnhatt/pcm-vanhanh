-- Migration 0003: Authentication & Account Management
-- Adds: username + password login, server-side sessions, account admin audit log.
-- Cloudflare D1 / SQLite compatible.
--
-- NOTE: the `must_change_password` column added below is dropped again by
-- migration 0004 (forced password change was removed). The column is kept here
-- so that databases migrated through 0003 can still run 0004 cleanly.
--
-- Default credentials for the seeded accounts:
--   username: admin | sale | kho | kythuat | qlkythuat | baohanh | qlship | shipper1 | shipper2
--   password: Pcshop@123

-- 1. Extend users table -------------------------------------------------------
ALTER TABLE users ADD COLUMN username TEXT;
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN last_login_at TEXT;
ALTER TABLE users ADD COLUMN failed_login_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TEXT;
ALTER TABLE users ADD COLUMN updated_at TEXT;

-- NULL usernames are allowed by SQLite unique indexes, so this only guards
-- real accounts. Legacy rows without a username simply cannot log in.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 2. Sessions ----------------------------------------------------------------
-- Only the SHA-256 digest of the cookie token is stored, so a database leak
-- cannot be replayed as a valid session.
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,                 -- sha256(token from cookie)
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_agent TEXT,
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  last_seen_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- 3. Auth audit log -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_audit_log (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  actor_name TEXT,
  action TEXT NOT NULL,                -- login_success | login_failed | logout | user_created | ...
  target_user_id TEXT,
  target_name TEXT,
  detail TEXT,                         -- JSON payload
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_created ON auth_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_audit_actor ON auth_audit_log(actor_user_id);

-- 4. Seed credentials for the 9 demo accounts ---------------------------------
UPDATE users SET
  username = 'admin',
  password_hash = 'pbkdf2_sha256$210000$S0blCZLBKSutyPR1kNhkfA==$dNKFBOqC2B02WaL2WJ04FkXpIb6z5iFAcadzF22q4K0=',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'usr_admin';

UPDATE users SET
  username = 'sale',
  password_hash = 'pbkdf2_sha256$210000$bu1gDkUvm8YmypRgaAJD/w==$DNlc28KUVrgkuBA8bjRLRzr0V5qwn3eMd+aBnFssPu4=',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'usr_sales';

UPDATE users SET
  username = 'kho',
  password_hash = 'pbkdf2_sha256$210000$LW0vhVn+RXotUoHHg3mzjA==$UBmTUogm45F/eR8VQWqK8JBI7tOQ7alsCVTJGVEXynM=',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'usr_warehouse';

UPDATE users SET
  username = 'kythuat',
  password_hash = 'pbkdf2_sha256$210000$AxbC4ZgOqG8uHsdBznfRLw==$xYbgeTEOjHNCyi+9rXBbXJwypeMJOWphMoKruGf3hto=',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'usr_tech';

UPDATE users SET
  username = 'qlkythuat',
  password_hash = 'pbkdf2_sha256$210000$sM1JC01+IR4TTS/jHXf6ZQ==$OEBgqrn0Uw74wljb3/gHVywhInDcP7Lkpht/3L6BEPs=',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'usr_tech_mgr';

UPDATE users SET
  username = 'baohanh',
  password_hash = 'pbkdf2_sha256$210000$G/jmpbUQiirrTmmLehVzNw==$eVQ7kXMHHBSiQ2msXsu/8GPCPygk511LERdqqi/3WmM=',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'usr_warranty';

UPDATE users SET
  username = 'qlship',
  password_hash = 'pbkdf2_sha256$210000$QUWYbMt38gWFOv6Li4Ll+A==$rihgcShRSqWuRgshnv2HyGwxL7/WMbdYomNH4avDpiE=',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'usr_ship_mgr';

UPDATE users SET
  username = 'shipper1',
  password_hash = 'pbkdf2_sha256$210000$lfnDT9j7FtMNWiDNRMAKng==$7Nd8Jqu9ai560kEwzzihNax6bwPRRUWF66RHdZrbstQ=',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'usr_shipper1';

UPDATE users SET
  username = 'shipper2',
  password_hash = 'pbkdf2_sha256$210000$ceWOJoqibfC9W6Ujb+EzIA==$lnoV0X1BIx4So50eQ8/TFdre3XrKejWL7IaQxF5sDoU=',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'usr_shipper2';
