import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireUser } from '@/lib/auth';

/**
 * GET /api/orders/by-invoice/:invoiceNo
 * Tra mã đơn (số tăng dần 1, 2, 3...; tương thích cả mã cũ HD-ngày-XXX) -> id đơn hàng.
 * Trang chi tiết /don-hang/[invoiceNo] gọi API này trước rồi fetch
 * /api/orders/[id] để lấy toàn bộ chi tiết (tránh duplicate logic).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceNo: string }> }
) {
  try {
    await requireUser();
    const { invoiceNo } = await params;
    const code = decodeURIComponent(invoiceNo || '').trim();
    if (!code) {
      return NextResponse.json({ error: 'Thiếu mã hóa đơn' }, { status: 400 });
    }

    const db = getDb();
    let row = await db
      .prepare('SELECT id, invoice_no FROM orders WHERE invoice_no = ?')
      .bind(code)
      .first<{ id: string; invoice_no: string }>();

    // Fallback không phân biệt hoa/thường (link share có thể bị đổi case)
    if (!row) {
      row = await db
        .prepare('SELECT id, invoice_no FROM orders WHERE LOWER(invoice_no) = LOWER(?)')
        .bind(code)
        .first<{ id: string; invoice_no: string }>();
    }

    if (!row) {
      return NextResponse.json({ error: `Không tìm thấy đơn hàng ${code}` }, { status: 404 });
    }
    return NextResponse.json({ id: row.id, invoice_no: row.invoice_no });
  } catch (e: any) {
    const status = e?.status || 401;
    return NextResponse.json(
      { error: e?.message || 'Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn' },
      { status }
    );
  }
}
