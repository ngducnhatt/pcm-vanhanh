import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { fetchOrderDetail, phonesMatch } from '@/lib/order-detail';
import { rateLimit } from '@/lib/rate-limit';
import { getRateLimitKey } from '@/lib/request-ip';
import { logServerError, toSafeError } from '@/lib/api-error';

/**
 * GET /api/orders/track/:invoiceNo[?phone=...] — API CÔNG KHAI cho khách hàng.
 *
 * - Nhân viên đã đăng nhập (session hợp lệ): trả toàn bộ chi tiết `{ order }`,
 *   không cần SĐT.
 * - Khách vãng lai: bắt buộc `?phone=` khớp SĐT trên đơn, chỉ trả lược đồ
 *   công khai `{ order: PublicOrder }` (ẩn serials, ghi chú nội bộ, nhân viên).
 *
 * Bảo mật:
 * - Rate limit theo IP (chỉ dùng IP từ proxy tin cậy) để chặn dò mã hoá đơn.
 * - Lỗi trả về không chứa chi tiết lỗi hệ thống.
 */
const TRACK_RATE_LIMIT = { limit: 20, windowMs: 60_000 };
const PHONE_RATE_LIMIT = { limit: 8, windowMs: 60_000 };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceNo: string }> }
) {
  try {
    const { invoiceNo } = await params;
    const code = decodeURIComponent(invoiceNo || '').trim();
    if (!code) {
      return NextResponse.json({ error: 'Thiếu mã hóa đơn' }, { status: 400 });
    }

    // Chặn dò mã hoá đơn: giới hạn theo IP thật (nếu không xác định được IP
    // thì tất cả client dùng chung 1 bucket — vẫn an toàn hơn không giới hạn).
    const ipKey = getRateLimitKey(request, 'orders-track');
    const ipLimit = rateLimit(ipKey, TRACK_RATE_LIMIT);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Quá nhiều yêu cầu tra cứu, vui lòng thử lại sau' },
        {
          status: 429,
          headers: {
            'Retry-After': String(ipLimit.retryAfterSeconds),
            'X-RateLimit-Limit': String(ipLimit.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const db = getDb();
    let idRow = await db
      .prepare('SELECT id FROM orders WHERE invoice_no = ?')
      .bind(code)
      .first<{ id: string }>();
    if (!idRow) {
      idRow = await db
        .prepare('SELECT id FROM orders WHERE LOWER(invoice_no) = LOWER(?)')
        .bind(code)
        .first<{ id: string }>();
    }
    if (!idRow) {
      return NextResponse.json({ error: `Không tìm thấy đơn hàng ${code}` }, { status: 404 });
    }

    // Nhân viên đã đăng nhập: xem full, không cần SĐT
    try {
      await requireUser();
      const order = await fetchOrderDetail(idRow.id);
      if (!order) {
        return NextResponse.json({ error: `Không tìm thấy đơn hàng ${code}` }, { status: 404 });
      }
      return NextResponse.json({ order, staff: true });
    } catch {
      /* không có phiên -> tiếp tục luồng khách hàng bên dưới */
    }

    const phone = request.nextUrl.searchParams.get('phone') || '';
    if (!phone.trim()) {
      // Khách chưa nhập SĐT: báo cho UI hiện form (không lộ dữ liệu)
      const order = await fetchOrderDetail(idRow.id);
      if (!order) {
        return NextResponse.json({ error: `Không tìm thấy đơn hàng ${code}` }, { status: 404 });
      }
      return NextResponse.json({ requirePhone: true, invoice_no: order.invoice_no });
    }

    // Giới hạn số lần thử SĐT sai — bảo vệ khách khỏi bị dò số điện thoại.
    const phoneKey = getRateLimitKey(request, 'orders-track-phone');
    const phoneLimit = rateLimit(phoneKey, PHONE_RATE_LIMIT);
    if (!phoneLimit.allowed) {
      return NextResponse.json(
        { error: 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau' },
        {
          status: 429,
          headers: {
            'Retry-After': String(phoneLimit.retryAfterSeconds),
            'X-RateLimit-Limit': String(phoneLimit.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const order = await fetchOrderDetail(idRow.id);
    if (!order) {
      return NextResponse.json({ error: `Không tìm thấy đơn hàng ${code}` }, { status: 404 });
    }
    if (!phonesMatch(phone, order.customer_phone)) {
      return NextResponse.json(
        { error: 'Số điện thoại không khớp với đơn hàng này' },
        { status: 403 }
      );
    }
    // Đã xác thực SĐT: trả đầy đủ chi tiết để hiện giao diện giống hệt nhân viên
    return NextResponse.json({ order, staff: false, verified: true });
  } catch (error: unknown) {
    logServerError('track-order', error);
    const safe = toSafeError(error, 'Lỗi tra cứu đơn hàng');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
