import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'pcm_session';

/**
 * Route protection.
 *
 * This runs on the edge runtime, so it can only check that a session cookie is
 * *present*. The real verification (hashed lookup in the sessions table,
 * expiry, is_active) happens server-side in `requireUser()` on every API route
 * and in `getCurrentUser()` for server components.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const isApi = pathname.startsWith('/api');

  if (hasSessionCookie) {
    // Already signed in: /login would just bounce back
    if (pathname === '/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (isApi) {
    // The login endpoint must stay reachable for anonymous visitors
    if (pathname === '/api/auth/login') {
      return NextResponse.next();
    }
    return NextResponse.json(
      { error: 'Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn' },
      { status: 401 }
    );
  }

  if (pathname === '/login') {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Phai cho qua ca file font (woff2/woff/ttf/otf): trang /login chua co cookie
  // nen neu khong loai chung, middleware se redirect file font ve /login va
  // trang dang nhap se khong tai duoc font.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot)$).*)',
  ],
};
