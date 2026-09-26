import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  authenticate,
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from '@/lib/auth';
import { statusFromError } from '@/lib/permissions';

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Vui lòng nhập tên đăng nhập').max(64),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu').max(128),
});

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json().catch(() => ({}));
    const parsed = loginSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu đăng nhập không hợp lệ' },
        { status: 400 }
      );
    }

    const ip =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      null;
    const userAgent = request.headers.get('user-agent');

    const result = await authenticate(parsed.data.username, parsed.data.password, { ip, userAgent });

    if (!result.ok || !result.user) {
      return NextResponse.json(
        {
          error: result.message || 'Đăng nhập thất bại',
          reason: result.reason,
          lockedUntil: result.lockedUntil ?? null,
        },
        { status: 401 }
      );
    }

    const user = result.user;
    const { token, expiresAt } = await createSession(user.id, { ip, userAgent });

    const response = NextResponse.json({
      success: true,
      user,
    });

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
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi hệ thống khi đăng nhập' },
      { status: statusFromError(error) }
    );
  }
}
