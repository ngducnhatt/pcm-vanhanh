import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { fetchOrderDetail, phonesMatch } from '@/lib/order-detail';

/**
 * GET /api/orders/track/:invoiceNo[?phone=...] — API CÔNG KHAI cho khách hàng.
 *
 * - Nhân viên đã đăng nhập (session hợp lệ): trả toàn bộ chi tiết `{ order }`,
 *   không cần SĐT.
 * - Khách vãng lai: bắt buộc `?phone=` khớp SĐT trên đơn, chỉ trả lược đồ
 *   công khai `{ order: PublicOrder }` (ẩn serials, ghi chú nội bộ, nhân viên).
 */
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
    const order = await fetchOrderDetail(idRow.id);
    if (!order) {
      return NextResponse.json({ error: `Không tìm thấy đơn hàng ${code}` }, { status: 404 });
    }
    if (!phone.trim()) {
      // Khách chưa nhập SĐT: báo cho UI hiện form (không lộ dữ liệu)
      return NextResponse.json({ requirePhone: true, invoice_no: order.invoice_no });
    }
    if (!phonesMatch(phone, order.customer_phone)) {
      return NextResponse.json(
        { error: 'Số điện thoại không khớp với đơn hàng này' },
        { status: 403 }
      );
    }
    // Đã xác thực SĐT: trả đầy đủ chi tiết để hiện giao diện giống hệt nhân viên
    return NextResponse.json({ order, staff: false, verified: true });
  } catch (e: any) {
    console.error('Error tracking order:', e);
    return NextResponse.json({ error: 'Lỗi tra cứu đơn hàng' }, { status: 500 });
  }
}
