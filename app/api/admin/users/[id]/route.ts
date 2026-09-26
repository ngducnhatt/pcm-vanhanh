import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import {
  destroyAllSessionsForUser,
  getUserById,
  isAccountLocked,
  requirePermission,
  writeAuditLog,
} from '@/lib/auth';
import { statusFromError } from '@/lib/permissions';
import { Role, ROLE_LABELS } from '@/lib/types';

const ROLES = Object.keys(ROLE_LABELS) as Role[];

const updateUserSchema = z.object({
  name: z.string().trim().min(2, 'Họ tên tối thiểu 2 ký tự').max(120).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  email: z.string().trim().email('Email không hợp lệ').max(160).optional(),
  username: z
    .string()
    .trim()
    .min(3, 'Tên đăng nhập tối thiểu 3 ký tự')
    .max(32, 'Tên đăng nhập tối đa 32 ký tự')
    .regex(/^[a-z0-9._-]+$/, 'Tên đăng nhập chỉ gồm chữ thường không dấu, số và các ký tự . _ -')
    .transform((value) => value.toLowerCase())
    .optional(),
  role: z.enum(ROLES as [Role, ...Role[]]).optional(),
  is_active: z.boolean().optional(),
  unlock: z.boolean().optional(),
});

async function countActiveAdmins(excludeUserId: string): Promise<number> {
  const db = getDb();
  const row = await db
    .prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND is_active = 1 AND id != ?")
    .bind(excludeUserId)
    .first<any>();
  return row?.total ?? 0;
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
        .prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE AND id != ?')
        .bind(patch.username, id)
        .first<any>();
      if (taken) {
        return NextResponse.json({ error: 'Tên đăng nhập đã tồn tại' }, { status: 409 });
      }
    }

    if (patch.email && patch.email.toLowerCase() !== (target.email || '').toLowerCase()) {
      const taken = await db
        .prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE AND id != ?')
        .bind(patch.email, id)
        .first<any>();
      if (taken) {
        return NextResponse.json({ error: 'Email đã được tài khoản khác sử dụng' }, { status: 409 });
      }
    }

    if (patch.role && patch.role !== 'admin' && target.id === actor.id) {
      return NextResponse.json({ error: 'Bạn không thể tự hạ quyền của mình' }, { status: 400 });
    }

    if (patch.role && patch.role !== target.role) {
      // The admin must not be able to lock the whole system out
      if (target.role === 'admin' && (await countActiveAdmins(id)) === 0) {
        return NextResponse.json(
          { error: 'Phải còn ít nhất 1 tài khoản Admin đang hoạt động' },
          { status: 400 }
        );
      }
    }

    if (patch.is_active === false && target.id === actor.id) {
      return NextResponse.json({ error: 'Bạn không thể tự vô hiệu hoạt tài khoản của mình' }, { status: 400 });
    }

    if (patch.is_active === false && target.role === 'admin' && (await countActiveAdmins(id)) === 0) {
      return NextResponse.json(
        { error: 'Phải còn ít nhất 1 tài khoản Admin đang hoạt động' },
        { status: 400 }
      );
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
      values.push(patch.phone || null);
      changes.push('phone');
    }
    if (patch.role !== undefined && patch.role !== target.role) {
      sets.push('role = ?');
      values.push(patch.role);
      changes.push(`role:${target.role}->${patch.role}`);
    }
    if (patch.is_active !== undefined && patch.is_active !== (target.is_active === 1)) {
      sets.push('is_active = ?');
      values.push(patch.is_active ? 1 : 0);
      if (!patch.is_active) {
        sets.push('locked_until = NULL', 'failed_login_count = 0');
      }
      changes.push(`is_active:${target.is_active}->${patch.is_active ? 1 : 0}`);
    }
    if (patch.unlock) {
      sets.push('locked_until = NULL', 'failed_login_count = 0');
      changes.push('unlock');
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'Không có thay đổi nào được áp dụng' }, { status: 400 });
    }

    sets.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).bind(...values).run();

    // Deactivating, renaming the login or demoting an admin invalidates live sessions
    const mustRevoke =
      patch.is_active === false ||
      (patch.username !== undefined && patch.username !== target.username) ||
      (patch.role !== undefined && patch.role !== target.role && patch.role !== 'admin');

    if (mustRevoke) {
      await destroyAllSessionsForUser(id);
    }

    const ip = request.headers.get('cf-connecting-ip') || null;
    const action = patch.is_active === false
      ? 'user_deactivated'
      : patch.is_active === true
        ? 'user_reactivated'
        : patch.unlock
          ? 'user_unlocked'
          : patch.role !== undefined && patch.role !== target.role
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
        `SELECT id, name, phone, email, role, is_active, created_at, username, last_login_at, locked_until, failed_login_count
         FROM users WHERE id = ?`
      )
      .bind(id)
      .first<any>();

    return NextResponse.json({ success: true, user: updated, changes, sessionsRevoked: mustRevoke });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi cập nhật tài khoản' },
      { status: statusFromError(error) }
    );
  }
}

/** DELETE /api/admin/users/[id] - vô hiệu hoạt tài khoản (soft delete) */
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
      return NextResponse.json({ error: 'Bạn không thể tự vô hiệu hoạt tài khoản của mình' }, { status: 400 });
    }

    if (target.role === 'admin' && (await countActiveAdmins(id)) === 0) {
      return NextResponse.json(
        { error: 'Phải còn ít nhất 1 tài khoản Admin đang hoạt động' },
        { status: 400 }
      );
    }

    const db = getDb();
    await db
      .prepare('UPDATE users SET is_active = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(id)
      .run();
    await destroyAllSessionsForUser(id);

    await writeAuditLog({
      action: 'user_deactivated',
      actor,
      targetUserId: id,
      targetName: target.name,
      detail: { soft_delete: true, was_locked: isAccountLocked(target) },
      ip: request.headers.get('cf-connecting-ip') || null,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deactivating user:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi vô hiệu hoạt tài khoản' },
      { status: statusFromError(error) }
    );
  }
}
