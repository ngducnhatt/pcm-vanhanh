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
    // Already signed in: /login would just bounce back (MPA: về Trung tâm đơn hàng)
    if (pathname === '/login' || pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/don-hang';
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
    // Tra cứu đơn hàng công khai cho khách (tự xác thực bằng SĐT ở API)
    if (pathname === '/api/orders/track' || pathname.startsWith('/api/orders/track/')) {
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

  // Trang chi tiết đơn hàng công khai (link duy nhất cho cả nhân viên lẫn khách).
  // Chỉ cho qua khi có mã đơn sau /don-hang/ ; trang danh sách /don-hang vẫn cần đăng nhập.
  const isPublicOrderPage =
    pathname.startsWith('/don-hang/') && pathname.length > '/don-hang/'.length;
  if (isPublicOrderPage) {
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
