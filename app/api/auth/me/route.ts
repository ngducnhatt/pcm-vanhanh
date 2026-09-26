import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { destroySession, getCurrentUser, SESSION_COOKIE_NAME, writeAuditLog } from '@/lib/auth';
import { statusFromError } from '@/lib/permissions';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: currentUser,
    });
  } catch (error: any) {
    console.error('Error fetching auth user:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi lấy thông tin người dùng' },
      { status: statusFromError(error) }
    );
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
      const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
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
  } catch (error: any) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi đăng xuất' },
      { status: statusFromError(error) }
    );
  }
}
