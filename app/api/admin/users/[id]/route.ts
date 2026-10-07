import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import {
  checkPasswordPolicy,
  destroyAllSessionsForUser,
  getUserById,
  requirePermission,
  setUserPassword,
  writeAuditLog,
} from '@/lib/auth';
import { statusFromError } from '@/lib/permissions';
import { Role, ROLE_LABELS } from '@/lib/types';

const ROLES = Object.keys(ROLE_LABELS) as Role[];

const updateUserSchema = z.object({
  name: z.string().trim().min(2, 'Họ tên tối thiểu 2 ký tự').max(120).optional(),
  phone: z.string().trim().min(1, 'Vui lòng nhập số điện thoại').max(30).optional(),
  email: z.string().trim().email('Email không hợp lệ').max(160).optional().nullable(),
  username: z
    .string()
    .trim()
    .min(3, 'Tên đăng nhập tối thiểu 3 ký tự')
    .max(32, 'Tên đăng nhập tối đa 32 ký tự')
    .regex(/^[a-z0-9._-]+$/, 'Tên đăng nhập chỉ gồm chữ thường không dấu, số và các ký tự . _ -')
    .transform((value) => value.toLowerCase())
    .optional(),
  roles: z.array(z.enum(ROLES as [Role, ...Role[]])).min(1, 'Vui lòng chọn ít nhất 1 vai trò').optional(),
  password: z.string().min(8, 'Mật khẩu mới tối thiểu 8 ký tự').max(128, 'Mật khẩu tối đa 128 ký tự').optional(),
  unlock: z.boolean().optional(),
});

async function countActiveAdmins(excludeUserId: string): Promise<number> {
  const db = getDb();
  const row = await db
    .prepare("SELECT COUNT(DISTINCT u.id) AS total FROM users u INNER JOIN user_roles ur ON u.id = ur.user_id WHERE ur.role = 'admin' AND u.is_active = 1 AND u.id != ?")
    .bind(excludeUserId)
    .first<any>();
  return Number(row?.total ?? 0);
}

/** PATCH /api/admin/users/[id] - sửa hồ sơ, đổi vai trò, khoá / mở khoá tài khoản */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requirePermission('account:manage');
    const { id } = await params;

    const target = await getUserById(id);
    if (!target) {
      return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 });
    }

    const raw = await request.json().catch(() => ({}));
    const parsed = updateUserSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const patch = parsed.data;
    const db = getDb();
    const changes: string[] = [];

    if (patch.username && patch.username !== target.username) {
      const taken = await db
        .prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?')
        .bind(patch.username, id)
        .first<any>();
      if (taken) {
        return NextResponse.json({ error: 'Tên đăng nhập đã tồn tại' }, { status: 409 });
      }
    }

    if (patch.email && patch.email.toLowerCase() !== (target.email || '').toLowerCase()) {
      const taken = await db
        .prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?')
        .bind(patch.email, id)
        .first<any>();
      if (taken) {
        return NextResponse.json({ error: 'Email đã được tài khoản khác sử dụng' }, { status: 409 });
      }
    }

    // Kiểm tra nếu admin tự hạ quyền hoặc tự vô hiệu hoạt
    if (patch.roles && !patch.roles.includes('admin') && target.roles.includes('admin') && target.id === actor.id) {
      return NextResponse.json({ error: 'Bạn không thể tự hạ quyền của mình' }, { status: 400 });
    }

    if (patch.roles && !patch.roles.includes('admin') && target.roles.includes('admin')) {
      if ((await countActiveAdmins(id)) === 0) {
        return NextResponse.json(
          { error: 'Phải còn ít nhất 1 tài khoản Admin đang hoạt động' },
          { status: 400 }
        );
      }
    }

    if (patch.password) {
      const policy = checkPasswordPolicy(patch.password);
      if (!policy.valid) {
        return NextResponse.json({ error: policy.errors[0] }, { status: 400 });
      }
    }

    const sets: string[] = [];
    const values: any[] = [];

    if (patch.name !== undefined && patch.name !== target.name) {
      sets.push('name = ?');
      values.push(patch.name);
      changes.push('name');
    }
    if (patch.username !== undefined && patch.username !== target.username) {
      sets.push('username = ?');
      values.push(patch.username);
      changes.push('username');
    }
    if (patch.email !== undefined && patch.email !== target.email) {
      sets.push('email = ?');
      values.push(patch.email);
      changes.push('email');
    }
    if (patch.phone !== undefined) {
      sets.push('phone = ?');
      values.push(patch.phone);
      changes.push('phone');
    }
    if (patch.unlock) {
      sets.push('locked_until = NULL', 'failed_login_count = 0');
      changes.push('unlock');
    }

    if (sets.length > 0) {
      sets.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      await db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).bind(...values).run();
    }

    // Cập nhật roles nếu có thay đổi
    if (patch.roles) {
      await db.prepare('DELETE FROM user_roles WHERE user_id = ?').bind(id).run();
      for (const role of patch.roles) {
        await db.prepare('INSERT INTO user_roles (user_id, role) VALUES (?, ?)').bind(id, role).run();
      }
      changes.push(`roles:${target.roles.join(',')}->${patch.roles.join(',')}`);
    }

    if (changes.length === 0 && !patch.password) {
      return NextResponse.json({ error: 'Không có thay đổi nào được áp dụng' }, { status: 400 });
    }

    // Đặt mật khẩu mới ngay trong form Sửa (thay nút Đặt lại mật khẩu riêng)
    let passwordChanged = false;
    if (patch.password) {
      await setUserPassword(id, patch.password);
      await destroyAllSessionsForUser(id);
      changes.push('password');
      passwordChanged = true;
    }

    // Renaming the login or demoting an admin invalidates live sessions
    const mustRevoke =
      passwordChanged ||
      (patch.username !== undefined && patch.username !== target.username) ||
      (patch.roles !== undefined && !patch.roles.includes('admin') && target.roles.includes('admin'));

    if (mustRevoke && !passwordChanged) {
      await destroyAllSessionsForUser(id);
    }

    const ip = request.headers.get('cf-connecting-ip') || null;
    const action = passwordChanged
      ? 'password_reset'
      : patch.unlock
        ? 'user_unlocked'
        : patch.roles !== undefined
          ? 'role_changed'
          : 'user_updated';

    await writeAuditLog({
      action,
      actor,
      targetUserId: id,
      targetName: target.name,
      detail: { changes, sessions_revoked: mustRevoke },
      ip,
    });

    const updated = await db
      .prepare(
        `SELECT u.id, u.name, u.phone, u.email, u.is_active, u.created_at, u.username, u.last_login_at, u.locked_until, u.failed_login_count,
                COALESCE(GROUP_CONCAT(ur.role), '') as roles
         FROM users u
         LEFT JOIN user_roles ur ON u.id = ur.user_id
         WHERE u.id = ?
         GROUP BY u.id`
      )
      .bind(id)
      .first<any>();

    const parsedUser = updated ? { ...updated, roles: typeof updated.roles === 'string' && updated.roles ? updated.roles.split(',') : [] } : updated;
    return NextResponse.json({ success: true, user: parsedUser, changes, sessionsRevoked: mustRevoke });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi cập nhật tài khoản' },
      { status: statusFromError(error) }
    );
  }
}

/** DELETE /api/admin/users/[id] - xoá hẳn tài khoản (hard delete) */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requirePermission('account:manage');
    const { id } = await params;

    const target = await getUserById(id);
    if (!target) {
      return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 });
    }

    if (target.id === actor.id) {
      return NextResponse.json({ error: 'Bạn không thể tự xoá tài khoản của mình' }, { status: 400 });
    }

    if (target.roles.includes('admin') && (await countActiveAdmins(id)) === 0) {
      return NextResponse.json(
        { error: 'Phải còn ít nhất 1 tài khoản Admin đang hoạt động' },
        { status: 400 }
      );
    }

    const db = getDb();
    // Chặn xoá khi tài khoản còn dính dữ liệu nghiệp vụ (tránh mồ côi đơn/hàng)
    const linked = await db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM orders WHERE sales_user_id = ?) AS orders_created,
           (SELECT COUNT(*) FROM order_status_history WHERE changed_by_user_id = ?) AS history_rows,
           (SELECT COUNT(*) FROM payments WHERE collected_by_user_id = ?) AS payments_rows,
           (SELECT COUNT(*) FROM shipments WHERE shipper_id = ? OR assigned_by_user_id = ?) AS shipment_rows`
      )
      .bind(id, id, id, id, id)
      .first<any>();
    const totalLinked =
      Number(linked?.orders_created || 0) +
      Number(linked?.history_rows || 0) +
      Number(linked?.payments_rows || 0) +
      Number(linked?.shipment_rows || 0);
    if (totalLinked > 0) {
      return NextResponse.json(
        {
          error: `Không thể xoá: tài khoản còn ${totalLinked} bản ghi liên quan (đơn hàng/lịch sử/thu tiền/giao hàng). Hãy giữ lại tài khoản.`,
        },
        { status: 400 }
      );
    }

    await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run();
    await db.prepare('DELETE FROM user_roles WHERE user_id = ?').bind(id).run();
    await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

    await writeAuditLog({
      action: 'user_deleted',
      actor,
      targetUserId: id,
      targetName: target.name,
      detail: { username: target.username },
      ip: request.headers.get('cf-connecting-ip') || null,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi xoá tài khoản' },
      { status: statusFromError(error) }
    );
  }
}
