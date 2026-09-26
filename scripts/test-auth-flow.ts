/**
 * Smoke test cho hệ thống đăng nhập & quản lý tài khoản.
 * Chạy sau `npm run db:reset`:  npm run test:auth
 */
import { getDb } from '../lib/db';
import { hashPassword, verifyPassword, generateToken, hashToken } from '../lib/crypto';
import {
  authenticate,
  checkPasswordPolicy,
  createSession,
  destroySession,
  getUserByUsername,
  MAX_FAILED_LOGINS,
  setUserPassword,
  validateSessionToken,
} from '../lib/auth';
import { can } from '../lib/permissions';
import { ROLE_LABELS, Role } from '../lib/types';

const DEFAULT_PASSWORD = 'Pcshop@123';
const TEST_USERNAME = 'test.auth.tmp';

let failures = 0;

async function runTest(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
  } catch (err: any) {
    failures++;
    console.error(`❌ [FAIL] ${name}: ${err.message}`);
  }
}

function assert(condition: any, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  console.log('====================================================');
  console.log('KIỂM THỬ HỆ THỐNG ĐĂNG NHẬP & QUẢN LÝ TÀI KHOẢN');
  console.log('====================================================\n');

  const db = getDb();
  const testUserId = `usr_${TEST_USERNAME}`;

  // Dọn dẹp nếu có dữ liệu cũ từ lần chạy trước
  await db.prepare('DELETE FROM users WHERE id = ?').bind(testUserId).run();

  // 1. Băm mật khẩu
  await runTest('Crypto: hash/verify mật khẩu', async () => {
    const hash = await hashPassword('XinChao@2026');
    assert(hash.startsWith('pbkdf2_sha256$'), 'Định dạng hash không đúng');
    assert(await verifyPassword('XinChao@2026', hash), 'Mật khẩu đúng phải verify thành công');
    assert(!(await verifyPassword('SaiMatKhau', hash)), 'Mật khẩu sai phải verify thất bại');
    assert(!(await verifyPassword('XinChao@2026', 'garbage')), 'Hash hỏng phải trả về false');
    assert(!(await verifyPassword('XinChao@2026', null)), 'Hash null phải trả về false');
  });

  await runTest('Crypto: salt ngẫu nhiên -> cùng mật khẩu sinh hash khác nhau', async () => {
    const a = await hashPassword('XinChao@2026');
    const b = await hashPassword('XinChao@2026');
    assert(a !== b, 'Hai lần băm cùng mật khẩu phải khác nhau');
  });

  await runTest('Crypto: token phiên là ngẫu nhiên và chỉ lưu dạng hash', async () => {
    const token = generateToken();
    assert(token.length >= 40, 'Token quá ngắn');
    assert((await hashToken(token)) !== token, 'Token lưu vào DB phải là hash');
  });

  // 2. Chính sách mật khẩu: tối giản, không ràng buộc độ phức tạp
  await runTest('Chính sách mật khẩu: chỉ chặn rỗng và quá dài', () => {
    assert(!checkPasswordPolicy('').valid, 'Mật khẩu rỗng phải bị từ chối');
    assert(!checkPasswordPolicy('   ').valid, 'Mật khẩu toàn khoảng trắng phải bị từ chối');
    assert(!checkPasswordPolicy('a'.repeat(129)).valid, 'Mật khẩu quá 128 ký tự phải bị từ chối');

    // Không còn yêu cầu hoa / thường / số / độ dài tối thiểu
    assert(checkPasswordPolicy('a').valid, 'Mật khẩu 1 ký tự phải được chấp nhận');
    assert(checkPasswordPolicy('123').valid, 'Chỉ chữ số phải được chấp nhận');
    assert(checkPasswordPolicy('abcdefghij').valid, 'Chỉ chữ thường phải được chấp nhận');
    assert(checkPasswordPolicy('admin').valid, 'Mật khẩu trùng tên đăng nhập vẫn được chấp nhận');
  });

  // 3. Tài khoản mẫu đã được seed
  await runTest('Seed: 9 tài khoản mẫu có username + mật khẩu', async () => {
    const admin = await getUserByUsername('admin');
    assert(admin, 'Không tìm thấy tài khoản admin');
    assert(admin!.role === 'admin', 'Tài khoản admin phải có vai trò admin');

    const result = await authenticate('admin', DEFAULT_PASSWORD);
    assert(result.ok, `Đăng nhập admin bằng mật khẩu mặc định thất bại: ${result.message}`);
  });

  await runTest('Seed: đủ 8 vai trò', async () => {
    for (const role of Object.keys(ROLE_LABELS) as Role[]) {
      const row = await db
        .prepare('SELECT COUNT(*) AS total FROM users WHERE role = ? AND password_hash IS NOT NULL')
        .bind(role)
        .first<any>();
      assert((row?.total ?? 0) > 0, `Chưa seed tài khoản cho vai trò ${role}`);
    }
  });

  // 4. Đăng nhập sai & khoá tài khoản
  await runTest('Đăng nhập: sai tên đăng nhập hoặc sai mật khẩu đều bị từ chối', async () => {
    const wrongUser = await authenticate('khong.ton.tai', DEFAULT_PASSWORD);
    assert(!wrongUser.ok && wrongUser.reason === 'invalid_credentials', 'Sai username phải bị từ chối');

    const wrongPass = await authenticate('admin', 'MatKhauSai@123');
    assert(!wrongPass.ok && wrongPass.reason === 'invalid_credentials', 'Sai mật khẩu phải bị từ chối');
  });

  await runTest('Đăng nhập: khoá tài khoản sau nhiều lần sai mật khẩu', async () => {
    const passwordHash = await hashPassword('MatKhau@2026');
    await db
      .prepare(
        `INSERT INTO users (id, name, email, role, is_active, username, password_hash)
         VALUES (?, ?, ?, ?, 1, ?, ?)`
      )
      .bind(testUserId, 'Tài khoản kiểm thử', 'test.auth@pcshop.vn', 'shipper', TEST_USERNAME, passwordHash)
      .run();

    for (let attempt = 1; attempt < MAX_FAILED_LOGINS; attempt++) {
      const result = await authenticate(TEST_USERNAME, 'SaiRoi@123');
      assert(!result.ok, `Lần thử ${attempt} phải thất bại`);
    }

    const locked = await authenticate(TEST_USERNAME, 'SaiRoi@123');
    assert(locked.reason === 'invalid_credentials' && Boolean(locked.lockedUntil), 'Chưa khoá sau khi đạt giới hạn');

    // Đúng mật khẩu nhưng vẫn bị chặn vì đang khoá
    const blocked = await authenticate(TEST_USERNAME, 'MatKhau@2026');
    assert(!blocked.ok && blocked.reason === 'account_locked', 'Tài khoản đang khoá phải bị chặn');

    // Mở khoá
    await db
      .prepare('UPDATE users SET locked_until = NULL, failed_login_count = 0 WHERE id = ?')
      .bind(testUserId)
      .run();

    const unlocked = await authenticate(TEST_USERNAME, 'MatKhau@2026');
    assert(unlocked.ok, 'Sau khi mở khoá phải đăng nhập được');
  });

  await runTest('Đăng nhập: tài khoản bị vô hiệu hoạt không đăng nhập được', async () => {
    await db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').bind(testUserId).run();
    const result = await authenticate(TEST_USERNAME, 'MatKhau@2026');
    assert(!result.ok && result.reason === 'inactive_account', 'Tài khoản vô hiệu hoạt phải bị từ chối');
    await db.prepare('UPDATE users SET is_active = 1 WHERE id = ?').bind(testUserId).run();
  });

  // 5. Phiên đăng nhập
  await runTest('Phiên: tạo -> xác thực -> huỷ', async () => {
    const { token, expiresAt } = await createSession(testUserId, { ip: '127.0.0.1', userAgent: 'test' });
    assert(new Date(expiresAt).getTime() > Date.now(), 'Phiên phải có hạn 7 ngày');

    const user = await validateSessionToken(token);
    assert(user?.id === testUserId, 'Xác thực token phải trả về đúng người dùng');

    // DB chỉ lưu hash của token
    const stored = await db
      .prepare('SELECT id FROM sessions WHERE user_id = ?')
      .bind(testUserId)
      .first<any>();
    assert(stored && stored.id !== token, 'Database phải lưu hash token, không lưu token thô');

    assert((await validateSessionToken(`${token}x`)) === null, 'Token bị sửa phải bị từ chối');
    assert((await validateSessionToken('')) === null, 'Token rỗng phải bị từ chối');

    await destroySession(token);
    assert((await validateSessionToken(token)) === null, 'Sau khi huỷ phiên phải không xác thực được');
  });

  await runTest('Phiên: tài khoản bị khoá giữa chừng thì phiên mất hiệu lực', async () => {
    const { token } = await createSession(testUserId);
    await db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').bind(testUserId).run();
    assert((await validateSessionToken(token)) === null, 'Phiên phải mất hiệu lực khi tài khoản bị vô hiệu hoạt');
    await db.prepare('UPDATE users SET is_active = 1 WHERE id = ?').bind(testUserId).run();
    assert((await validateSessionToken(token)) !== null, 'Kích hoạt lại thì phiên cũ dùng lại được');
  });

  // 6. Đặt lại mật khẩu
  await runTest('Đặt lại mật khẩu: mật khẩu mới hoạt động, mật khẩu cũ không còn', async () => {
    await setUserPassword(testUserId, 'MatKhauMoi@2026');

    assert((await authenticate(TEST_USERNAME, 'MatKhauMoi@2026')).ok, 'Mật khẩu mới phải đăng nhập được');
    assert(!(await authenticate(TEST_USERNAME, 'MatKhau@2026')).ok, 'Mật khẩu cũ không còn hiệu lực');
  });

  await runTest('Đặt lại mật khẩu: không còn cờ bắt buộc đổi mật khẩu', async () => {
    const user = await getUserByUsername(TEST_USERNAME);
    assert(user !== null, 'Tài khoản kiểm thử phải tồn tại');
    assert(
      !('must_change_password' in (user as object)),
      'Cột must_change_password phải được gỡ khỏi hệ thống'
    );
  });

  await runTest('Mật khẩu đơn giản vẫn đăng nhập được', async () => {
    await setUserPassword(testUserId, 'a');
    assert((await authenticate(TEST_USERNAME, 'a')).ok, 'Mật khẩu 1 ký tự phải đăng nhập được');

    await setUserPassword(testUserId, '123');
    assert((await authenticate(TEST_USERNAME, '123')).ok, 'Mật khẩu chỉ chữ số phải đăng nhập được');
  });

  // 7. Phân quyền
  await runTest('Phân quyền: chỉ Admin được quản lý tài khoản', () => {
    assert(can('admin', 'account:manage'), 'Admin phải có quyền account:manage');
    for (const role of Object.keys(ROLE_LABELS) as Role[]) {
      if (role === 'admin') continue;
      assert(!can(role, 'account:manage'), `Vai trò ${role} không được có account:manage`);
    }
    assert(can('kinh_doanh', 'order:create'), 'Kinh doanh phải tạo được đơn');
    assert(!can('quan_ly_ky_thuat', 'order:complete_kithuat'), 'QLKT chỉ giám sát, không được duyệt');
  });

  // 8. Nhật ký quản trị
  await runTest('Nhật ký: ghi nhận đăng nhập thành công / thất bại', async () => {
    const success = await db
      .prepare("SELECT COUNT(*) AS total FROM auth_audit_log WHERE action = 'login_success'")
      .first<any>();
    const failed = await db
      .prepare("SELECT COUNT(*) AS total FROM auth_audit_log WHERE action = 'login_failed'")
      .first<any>();
    assert((success?.total ?? 0) > 0, 'Chưa ghi nhận đăng nhập thành công');
    assert((failed?.total ?? 0) > 0, 'Chưa ghi nhận đăng nhập thất bại');
  });

  // Dọn dẹp
  await db.prepare('DELETE FROM users WHERE id = ?').bind(testUserId).run();

  console.log('\n====================================================');
  if (failures === 0) {
    console.log('KẾT QUẢ: TẤT CẢ KIỂM THỬ ĐỀU ĐẠT ✅');
  } else {
    console.log(`KẾT QUẢ: ${failures} KIỂM THỬ THẤT BẠI ❌`);
  }
  console.log('====================================================');

  process.exit(failures === 0 ? 0 : 1);
}

main();
