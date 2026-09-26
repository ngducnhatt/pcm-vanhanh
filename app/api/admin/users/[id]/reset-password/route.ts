import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/crypto';
import {
  checkPasswordPolicy,
  destroyAllSessionsForUser,
  getUserById,
  requirePermission,
  setUserPassword,
  writeAuditLog,
} from '@/lib/auth';
import { statusFromError } from '@/lib/permissions';

/**
 * POST /api/admin/users/[id]/reset-password
 * Body (optional): { password?: string }
 * Without a password, a random one is generated and returned ONCE.
 */
export async function POST(
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
    const adminPassword: string | null = typeof raw?.password === 'string' && raw.password ? raw.password : null;

    const password = adminPassword || generateToken(9);

    const policy = checkPasswordPolicy(password);
    if (!policy.valid) {
      return NextResponse.json({ error: policy.errors[0], errors: policy.errors }, { status: 400 });
    }

    await setUserPassword(id, password);
    // A reset must kill every existing session of that account
    await destroyAllSessionsForUser(id);

    await writeAuditLog({
      action: 'password_reset',
      actor,
      targetUserId: id,
      targetName: target.name,
      detail: { generated: !adminPassword },
      ip: request.headers.get('cf-connecting-ip') || null,
    });

    return NextResponse.json({
      success: true,
      message: `Đã đặt lại mật khẩu cho ${target.name}`,
      temporaryPassword: adminPassword ? null : password,
    });
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi đặt lại mật khẩu' },
      { status: statusFromError(error) }
    );
  }
}
