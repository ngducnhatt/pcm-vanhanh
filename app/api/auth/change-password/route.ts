import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  checkPasswordPolicy,
  createSession,
  destroyAllSessionsForUser,
  requireUser,
  setUserPassword,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  writeAuditLog,
} from '@/lib/auth';
import { statusFromError } from '@/lib/permissions';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại').max(128),
  newPassword: z.string().min(1, 'Vui lòng nhập mật khẩu mới').max(128),
});
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireUser();

    const raw = await request.json().catch(() => ({}));
    const parsed = changePasswordSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'Mật khẩu mới phải khác mật khẩu hiện tại' }, { status: 400 });
    }

    // Re-verify the current password so a stolen session cannot lock the owner out
    const { verifyPassword } = await import('@/lib/crypto');
    const { getUserCredentialsByUsername } = await import('@/lib/auth');
    const record = currentUser.username ? await getUserCredentialsByUsername(currentUser.username) : null;

    if (!record || !(await verifyPassword(currentPassword, record.password_hash))) {
      await writeAuditLog({
        action: 'login_failed',
        actor: currentUser,
        targetUserId: currentUser.id,
        targetName: currentUser.name,
        detail: { reason: 'wrong_current_password_on_change' },
      });
      return NextResponse.json({ error: 'Mật khẩu hiện tại không đúng' }, { status: 400 });
    }

    const policy = checkPasswordPolicy(newPassword);
    if (!policy.valid) {
      return NextResponse.json({ error: policy.errors[0], errors: policy.errors }, { status: 400 });
    }

    await setUserPassword(currentUser.id, newPassword);

    // Invalidate every other session, then re-issue one for the current device
    await destroyAllSessionsForUser(currentUser.id);
    const { token, expiresAt } = await createSession(currentUser.id, {
      ip: request.headers.get('cf-connecting-ip') || null,
      userAgent: request.headers.get('user-agent'),
    });

    await writeAuditLog({
      action: 'password_changed',
      actor: currentUser,
      targetUserId: currentUser.id,
      targetName: currentUser.name,
      detail: { self_service: true },
    });

    const response = NextResponse.json({ success: true, message: 'Đổi mật khẩu thành công' });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(expiresAt),
      maxAge: SESSION_TTL_MS / 1000,
    });

    return response;
  } catch (error: any) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi đổi mật khẩu' },
      { status: statusFromError(error) }
    );
  }
}
