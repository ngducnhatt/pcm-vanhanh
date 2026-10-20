/**
 * Đặt lại mật khẩu cho một tài khoản từ command line (dùng khi admin khoá máy
 * hoặc quên mật khẩu admin).
 *
 *   npm run user:password -- <username> [matKhauMoi]
 *
 * Không truyền mật khẩu -> hệ thống sinh một mật khẩu ngẫu nhiên.
 * Mọi phiên đăng nhập đang hoạt động của tài khoản đó sẽ bị huỷ.
 */
import 'dotenv/config';
import { closeDb, getDb } from '../lib/db';
import { generateToken, hashPassword } from '../lib/crypto';
import { checkPasswordPolicy, writeAuditLog } from '../lib/auth';

async function main() {
  const username = (process.argv[2] || '').trim().toLowerCase();
  const provided = process.argv[3];

  if (!username) {
    console.error('Cách dùng: npm run user:password -- <username> [matKhauMoi]');
    process.exit(1);
  }

  const db = getDb();
  const user = await db
    .prepare('SELECT id, name, username FROM users WHERE LOWER(username) = LOWER(?)')
    .bind(username)
    .first<any>();

  if (!user) {
    console.error(`Không tìm thấy tài khoản có tên đăng nhập "${username}"`);
    process.exit(1);
  }

  const roleRows = await db
    .prepare('SELECT role FROM user_roles WHERE user_id = ? ORDER BY role')
    .bind(user.id)
    .all<{ role: string }>();
  const roleLabels = (roleRows.results || []).map((row) => row.role).join(', ') || 'chưa có vai trò';

  const password = provided || generateToken(9);
  const policy = checkPasswordPolicy(password);

  if (!policy.valid) {
    console.error('Mật khẩu không đạt yêu cầu:');
    policy.errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  await db
    .prepare(
      `UPDATE users
       SET password_hash = ?, failed_login_count = 0,
           locked_until = NULL, is_active = 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(passwordHash, user.id)
    .run();

  await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run();

  await writeAuditLog({
    action: 'password_reset',
    actorName: 'cli (no user)',
    targetUserId: user.id,
    targetName: user.name,
    detail: { generated: !provided, via: 'cli' },
  });

  console.log(`\nĐã đặt lại mật khẩu cho ${user.name} (${roleLabels}).`);
  console.log(`Mật khẩu: ${password}`);
  console.log('Tài khoản đã được mở khoá và kích hoạt lại nếu trước đó bị khoá.');
  console.log('Tất cả phiên đăng nhập cũ đã bị huỷ.\n');
  await closeDb();
}

main().catch(async (error) => {
  console.error('Đặt lại mật khẩu thất bại:', error);
  try {
    await closeDb();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
