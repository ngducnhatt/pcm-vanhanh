import { cookies } from 'next/headers';
import { logServerError, toSafeError } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { destroySession, getCurrentUser, SESSION_COOKIE_NAME, writeAuditLog } from '@/lib/auth';
import { statusFromError } from '@/lib/permissions';
import { getClientIp } from '@/lib/request-ip';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      const response = NextResponse.json(
        { error: 'Chưa đăng nhập' },
        {
          status: 401,
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        }
      );
      response.cookies.set(SESSION_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
      return response;
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: currentUser,
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error: unknown) {
    console.error('Error fetching auth user:', error);
    const safe = toSafeError(error, 'Lỗi lấy thông tin người dùng');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const currentUser = await getCurrentUser();

    if (token) {
      await destroySession(token);
    }

    if (currentUser) {
      const ip = getClientIp(request);
      await writeAuditLog({
        action: 'logout',
        actor: currentUser,
        targetUserId: currentUser.id,
        targetName: currentUser.name,
        ip,
      });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error: unknown) {
    console.error('Error during logout:', error);
    const safe = toSafeError(error, 'Lỗi hệ thống');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
