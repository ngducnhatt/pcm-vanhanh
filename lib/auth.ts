import { cookies } from 'next/headers';
import { getDb } from './db';
import { generateToken, hashPassword, hashToken, verifyPassword } from './crypto';
import { AuthError, can, Permission } from './permissions';
import { AuthUser, Role, User } from './types';

export const SESSION_COOKIE_NAME = 'pcm_session';
export const SESSION_TTL_DAYS = 7;
export const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

/** Brute-force protection */
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

export type { AuthUser, User };

export interface RequestMeta {
  ip?: string | null;
  userAgent?: string | null;
}

const USER_COLUMNS = 'id, name, phone, email, is_active, created_at, username, last_login_at, locked_until, failed_login_count';

async function getUserRoles(userId: string): Promise<Role[]> {
  const db = getDb();
  const result = await db
    .prepare('SELECT role FROM user_roles WHERE user_id = ?')
    .bind(userId)
    .all<{ role: Role }>();
  return (result.results || []).map((row) => row.role);
}

function toAuthUser(row: any, roles: Role[]): AuthUser {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? null,
    email: row.email,
    roles,
    is_active: row.is_active,
    created_at: row.created_at,
    username: row.username ?? null,
    last_login_at: row.last_login_at ?? null,
    locked_until: row.locked_until ?? null,
    failed_login_count: row.failed_login_count ?? 0,
  };
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${generateToken(6).replace(/[-_]/g, '').toLowerCase()}`;
}

// ---------------------------------------------------------------------------
// User lookups
// ---------------------------------------------------------------------------

/**
 * Fetch a user by ID (never exposes the password hash)
 */
export async function getUserById(id: string): Promise<AuthUser | null> {
  const db = getDb();
  const row = await db.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`).bind(id).first<any>();
  if (!row) return null;
  const roles = await getUserRoles(id);
  return toAuthUser(row, roles);
}

/**
 * Fetch a user by login username (case-insensitive)
 */
export async function getUserByUsername(username: string): Promise<AuthUser | null> {
  const db = getDb();
  const row = await db
    .prepare(`SELECT ${USER_COLUMNS} FROM users WHERE username = LOWER(?)`)
    .bind(username)
    .first<any>();
  if (!row) return null;
  const roles = await getUserRoles(row.id);
  return toAuthUser(row, roles);
}

/**
 * Fetch users including the password hash. Server-side use only (login flow).
 */
export async function getUserCredentialsByUsername(
  username: string
): Promise<(AuthUser & { password_hash: string | null }) | null> {
  const db = getDb();
  const row = await db
    .prepare(`SELECT ${USER_COLUMNS}, password_hash FROM users WHERE username = LOWER(?)`)
    .bind(username)
    .first<any>();
  if (!row) return null;
  const roles = await getUserRoles(row.id);
  return { ...toAuthUser(row, roles), password_hash: row.password_hash ?? null };
}

/**
 * Fetch all active users
 */
export async function getAllUsers(): Promise<AuthUser[]> {
  const db = getDb();
  const result = await db
    .prepare(`SELECT ${USER_COLUMNS} FROM users WHERE is_active = 1 ORDER BY name`)
    .all<any>();
  const users = result.results || [];
  return Promise.all(users.map(async (row) => {
    const roles = await getUserRoles(row.id);
    return toAuthUser(row, roles);
  }));
}

/**
 * Fetch users with a specific role (e.g. shippers)
 */
export async function getUsersByRole(role: Role): Promise<AuthUser[]> {
  const db = getDb();
  const result = await db
    .prepare(`SELECT ${USER_COLUMNS} FROM users u INNER JOIN user_roles ur ON u.id = ur.user_id WHERE ur.role = ? AND u.is_active = 1 ORDER BY u.name`)
    .bind(role)
    .all<any>();
  const users = result.results || [];
  return Promise.all(users.map(async (row) => {
    const roles = await getUserRoles(row.id);
    return toAuthUser(row, roles);
  }));
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export type AuditAction =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'user_created'
  | 'user_updated'
  | 'user_locked'
  | 'user_unlocked'
  | 'user_deactivated'
  | 'user_deleted'
  | 'user_reactivated'
  | 'role_changed'
  | 'password_changed'
  | 'password_reset'
  | 'order_created'
  | 'order_updated'
  | 'order_cancelled'
  | 'order_status_changed'
  | 'order_payment_collected'
  | 'order_shipment_assigned'
  | 'order_exported';

/**
 * Records security-relevant actions. Never throws: audit logging must not
 * break the business operation it describes.
 */
export async function writeAuditLog(params: {
  action: AuditAction;
  actor?: AuthUser | null;
  actorName?: string | null;
  targetUserId?: string | null;
  targetName?: string | null;
  detail?: Record<string, unknown>;
  ip?: string | null;
}): Promise<void> {
  try {
    const db = getDb();
    await db
      .prepare(
        `INSERT INTO auth_audit_log (id, actor_user_id, actor_name, action, target_user_id, target_name, detail, ip)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        newId('log'),
        params.actor?.id ?? null,
        params.actor?.name ?? params.actorName ?? null,
        params.action,
        params.targetUserId ?? null,
        params.targetName ?? null,
        params.detail ? JSON.stringify(params.detail) : null,
        params.ip ?? null
      )
      .run();
  } catch (error) {
    console.error('[auth] failed to write audit log:', error);
  }
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export type LoginFailureReason =
  | 'invalid_credentials'
  | 'inactive_account'
  | 'no_username'
  | 'account_locked';

export interface LoginResult {
  ok: boolean;
  user?: AuthUser;
  reason?: LoginFailureReason;
  message?: string;
  lockedUntil?: string;
}

/**
 * Verifies credentials and applies lockout rules.
 * A generic message is returned for every credential failure so the UI cannot
 * be used to enumerate existing usernames.
 */
export async function authenticate(
  username: string,
  password: string,
  meta: RequestMeta = {}
): Promise<LoginResult> {
  const db = getDb();
  const normalized = username.trim();

  if (!normalized) {
    await writeAuditLog({
      action: 'login_failed',
      detail: { reason: 'no_username' },
      ip: meta.ip,
    });
    return { ok: false, reason: 'no_username', message: 'Vui lòng nhập tên đăng nhập' };
  }

  const record = await getUserCredentialsByUsername(normalized);

  if (!record) {
    // Spend a hash anyway to keep the response time roughly constant
    await verifyPassword(password, 'pbkdf2_sha256$210000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
    await writeAuditLog({ action: 'login_failed', detail: { username: normalized, reason: 'invalid_credentials' }, ip: meta.ip });
    return { ok: false, reason: 'invalid_credentials', message: 'Tên đăng nhập hoặc mật khẩu không đúng' };
  }

  const now = Date.now();

  if (record.locked_until && new Date(record.locked_until).getTime() > now) {
    await writeAuditLog({
      action: 'login_failed',
      actorName: record.name,
      targetUserId: record.id,
      targetName: record.name,
      detail: { reason: 'account_locked' },
      ip: meta.ip,
    });
    return {
      ok: false,
      reason: 'account_locked',
      lockedUntil: record.locked_until,
      message: `Tài khoản đang bị tạm khoá. Vui lòng thử lại sau ${record.locked_until}.`,
    };
  }

  if (!record.is_active) {
    await writeAuditLog({
      action: 'login_failed',
      actorName: record.name,
      targetUserId: record.id,
      targetName: record.name,
      detail: { reason: 'inactive_account' },
      ip: meta.ip,
    });
    return { ok: false, reason: 'inactive_account', message: 'Tài khoản đã bị vô hiệu hoạt. Liên hệ quản trị viên.' };
  }

  const valid = await verifyPassword(password, record.password_hash);

  if (!valid) {
    // Atomic: tăng counter ngay trong SQL để chống burst song song bypass lockout
    const lockUntil = new Date(now + LOCK_MINUTES * 60 * 1000).toISOString();
    await db
      .prepare(
        `UPDATE users SET
           failed_login_count = CASE WHEN failed_login_count >= ? THEN 0 ELSE failed_login_count + 1 END,
           locked_until = CASE WHEN failed_login_count + 1 >= ? THEN ? ELSE locked_until END,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .bind(MAX_FAILED_LOGINS - 1, MAX_FAILED_LOGINS, lockUntil, record.id)
      .run();

    const failedCount = Math.min((record.failed_login_count || 0) + 1, MAX_FAILED_LOGINS);
    const shouldLock = failedCount >= MAX_FAILED_LOGINS;
    const lockedUntil = shouldLock ? lockUntil : null;

    await writeAuditLog({
      action: 'login_failed',
      actorName: record.name,
      targetUserId: record.id,
      targetName: record.name,
      detail: { reason: 'invalid_credentials', failed_count: failedCount, locked: shouldLock },
      ip: meta.ip,
    });

    return {
      ok: false,
      reason: 'invalid_credentials',
      lockedUntil: lockedUntil ?? undefined,
      message: shouldLock
        ? `Sai quá ${MAX_FAILED_LOGINS} lần. Tài khoản bị khoá trong ${LOCK_MINUTES} phút.`
        : `Tên đăng nhập hoặc mật khẩu không đúng (còn ${MAX_FAILED_LOGINS - failedCount} lần thử)`,
    };
  }

  // Success: clear lockout counters
  await db
    .prepare(
      'UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    )
    .bind(record.id)
    .run();

  const { password_hash: _discarded, ...user } = record;
  const authenticated = user as AuthUser;

  await writeAuditLog({
    action: 'login_success',
    actor: authenticated,
    targetUserId: authenticated.id,
    targetName: authenticated.name,
    ip: meta.ip,
  });

  return { ok: true, user: authenticated };
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

function toIsoPlus(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

/**
 * Issues a session and returns the raw token to be stored in an httpOnly cookie.
 * Only `hashToken(token)` is persisted.
 */
export async function createSession(
  userId: string,
  meta: RequestMeta = {}
): Promise<{ token: string; expiresAt: string }> {
  const db = getDb();
  const token = generateToken(32);
  const sessionId = await hashToken(token);
  const expiresAt = toIsoPlus(SESSION_TTL_MS);

  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, user_agent, ip, expires_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(sessionId, userId, meta.userAgent ?? null, meta.ip ?? null, expiresAt)
    .run();

  return { token, expiresAt };
}

export async function validateSessionToken(token: string): Promise<AuthUser | null> {
  if (!token) return null;

  const db = getDb();
  const sessionId = await hashToken(token);

  const row = await db
    .prepare(
      `SELECT s.id AS session_id, s.expires_at, u.${USER_COLUMNS.split(', ').join(', u.')}
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`
    )
    .bind(sessionId)
    .first<any>();

  if (!row) return null;

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
    return null;
  }

  if (!row.is_active) return null;

  // Refresh last_seen_at at most once every 5 minutes to limit writes
  const lastSeen = new Date(row.last_seen_at || 0).getTime();
  if (Date.now() - lastSeen > 5 * 60 * 1000) {
    await db.prepare('UPDATE sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?').bind(sessionId).run();
  }

  const roles = await getUserRoles(row.id);
  return toAuthUser(row, roles);
}

export async function destroySession(token: string): Promise<void> {
  if (!token) return;
  const db = getDb();
  await db.prepare('DELETE FROM sessions WHERE id = ?').bind(await hashToken(token)).run();
}

export async function destroyAllSessionsForUser(userId: string): Promise<void> {
  const db = getDb();
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
}

export async function listUserSessions(userId: string) {
  const db = getDb();
  const result = await db
    .prepare(
      `SELECT id, ip, user_agent, created_at, last_seen_at, expires_at
       FROM sessions WHERE user_id = ? AND expires_at > ? ORDER BY last_seen_at DESC`
    )
    .bind(userId, new Date().toISOString())
    .all<any>();
  return result.results || [];
}

export async function purgeExpiredSessions(): Promise<number> {
  const db = getDb();
  const result = await db.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(new Date().toISOString()).run();
  return result?.meta?.changes ?? 0;
}

// ---------------------------------------------------------------------------
// Current user resolution
// ---------------------------------------------------------------------------

/**
 * Returns the signed-in user from the session cookie, or null when there is
 * no valid session. No fallback identity exists any more.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  let token: string | undefined;
  try {
    const cookieStore = await cookies();
    token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  } catch {
    // Called outside of a request context (e.g. from a script)
    return null;
  }

  if (!token) return null;
  return validateSessionToken(token);
}

/**
 * Throws AuthError(401) when there is no valid session.
 */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError('Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn', 401, 'unauthenticated');
  }
  if (!user.is_active) {
    throw new AuthError('Tài khoản đã bị vô hiệu hoạt', 403, 'account_inactive');
  }
  return user;
}

/**
 * Throws AuthError(401/403) unless the current user holds the permission.
 */
export async function requirePermission(permission: Permission): Promise<AuthUser> {
  const user = await requireUser();
  if (!can(user.roles, permission)) {
    throw new AuthError('Bạn không có quyền thực hiện thao tác này', 403, 'forbidden');
  }
  return user;
}

// ---------------------------------------------------------------------------
// Passwords
// ---------------------------------------------------------------------------

export async function setUserPassword(userId: string, password: string): Promise<void> {
  const db = getDb();
  const passwordHash = await hashPassword(password);
  await db
    .prepare(
      `UPDATE users
       SET password_hash = ?, failed_login_count = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(passwordHash, userId)
    .run();
}

export interface PasswordPolicyResult {
  valid: boolean;
  errors: string[];
}

/**
 * Mật khẩu tối thiểu 8 ký tự, tối đa 128 (đủ cho nhân viên, chặn 123/admin).
 */
export function checkPasswordPolicy(password: string): PasswordPolicyResult {
  const errors: string[] = [];

  if (!password || password.trim().length === 0) {
    errors.push('Mật khẩu không được để trống');
  } else if (password.length < 8) {
    errors.push('Mật khẩu phải từ 8 ký tự trở lên');
  }
  if (password.length > 128) {
    errors.push('Mật khẩu không được vượt quá 128 ký tự');
  }

  return { valid: errors.length === 0, errors };
}

export function isAccountLocked(user: AuthUser): boolean {
  return Boolean(user.locked_until && new Date(user.locked_until).getTime() > Date.now());
}
