import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { notifyOrderEvent } from '@/lib/notifications';
import { statusFromError } from '@/lib/permissions';
import { getNextStatusAfterKhoDone } from '@/lib/state-machine';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requirePermission('order:export_kho');

    if (!currentUser.roles.includes('kho') && !currentUser.roles.includes('admin')) {
      return NextResponse.json(
        { error: 'Chỉ nhân viên Kho hoặc Admin mới có quyền thực hiện xuất kho' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { items, note } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Danh sách linh kiện xuất kho không hợp lệ' },
        { status: 400 }
      );
    }

    // Check that each item has a serial number
    for (const item of items) {
      if (typeof item.serial_number !== 'string' || !item.serial_number.trim()) {
        return NextResponse.json(
          { error: `Linh kiện chưa được gắn mã serial number đầy đủ` },
          { status: 400 }
        );
      }
    }

    const db = getDb();
    const orderRow = await db
      .prepare('SELECT id, invoice_no, status, tags, sales_user_id FROM orders WHERE id = ?')
      .bind(id)
      .first<any>();

    if (!orderRow) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    if (orderRow.status !== 'kho_pending' && orderRow.status !== 'new') {
      return NextResponse.json(
        { error: `Đơn hàng ở trạng thái ${orderRow.status}, không thể thực hiện xuất kho` },
        { status: 400 }
      );
    }

    const orderItems = (
      await db
        .prepare(
          `SELECT oi.id, p.name as product_name, p.sku
           FROM order_items oi
           LEFT JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = ?`
        )
        .bind(id)
        .all<any>()
    ).results || [];
    const orderItemById = new Map(orderItems.map((item: any) => [item.id, item]));
    const submittedIds = items.map((item: any) => item.id);
    if (
      submittedIds.length !== orderItems.length ||
      new Set(submittedIds).size !== submittedIds.length ||
      submittedIds.some((itemId: string) => !orderItemById.has(itemId))
    ) {
      return NextResponse.json(
        { error: 'Danh sách linh kiện xuất kho không khớp với đơn hàng' },
        { status: 400 }
      );
    }
    const serials = items.map((item: any) => item.serial_number.trim().toLowerCase());
    if (new Set(serials).size !== serials.length) {
      return NextResponse.json(
        { error: 'Mỗi linh kiện phải có một mã serial riêng biệt' },
        { status: 400 }
      );
    }

    // Update serial number for each item
    for (const item of items) {
      await db
        .prepare('UPDATE order_items SET serial_number = ? WHERE id = ? AND order_id = ?')
        .bind(item.serial_number.trim(), item.id, id)
        .run();
    }

    let parsedTags: string[] = [];
    try {
      parsedTags = JSON.parse(orderRow.tags || '[]');
    } catch {
      parsedTags = [];
    }

    // Determine next state
    const nextStatus = getNextStatusAfterKhoDone(parsedTags);

    // Update order status
    await db
      .prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(nextStatus, id)
      .run();

    const serialLog = items.map((item: any) => {
      const orderItem = orderItemById.get(item.id);
      return `${orderItem?.product_name || orderItem?.sku || item.id}: ${item.serial_number.trim()}`;
    }).join('; ');
    const exportNote = [
      note?.trim() || 'Kho đã kiểm tra linh kiện, quét mã vạch và gắn serial thành công',
      `Serial đã gán: ${serialLog}`,
    ].join('. ');

    // 1. Log kho_done history
    const histId1 = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db
      .prepare(
        `INSERT INTO order_status_history (id, order_id, status, changed_by_user_id, note)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        histId1,
        id,
        'kho_done',
        currentUser.id,
        exportNote
      )
      .run();

    // 2. Log transition to next status history
    const histId2 = `hist_${Date.now() + 1}_${Math.random().toString(36).substring(2, 7)}`;
    let transitionReason = '';
    if (nextStatus === 'kithuat_pending') {
      transitionReason = 'Tự động chuyển hàng đợi Kỹ Thuật (theo tag kỹ thuật)';
    } else if (nextStatus === 'baohanh_pending') {
      transitionReason = 'Tự động chuyển hàng đợi Bảo Hành (theo tag bảo hành)';
    } else {
      transitionReason = 'Tự động chuyển hàng đợi Giao Hàng (không yêu cầu kỹ thuật/bảo hành)';
    }

    await db
      .prepare(
        `INSERT INTO order_status_history (id, order_id, status, changed_by_user_id, note)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(histId2, id, nextStatus, currentUser.id, transitionReason)
      .run();

    // Tag người tạo đơn + nhóm tiếp theo (kỹ thuật/bảo hành/giao hàng)
    await notifyOrderEvent({
      actor: currentUser,
      orderId: id,
      invoiceNo: orderRow.invoice_no,
      salesUserId: orderRow.sales_user_id,
      kind: 'order_exported',
      title: `Kho đã xuất ${orderRow.invoice_no}`,
      message: transitionReason,
      newStatus: nextStatus,
    });

    return NextResponse.json({
      success: true,
      orderId: id,
      nextStatus,
      message: `Đã xuất kho thành công! Trạng thái đơn chuyển sang: ${nextStatus}`,
    });
  } catch (error: any) {
    console.error('Error exporting warehouse order:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi xử lý xuất kho' },
      { status: statusFromError(error) }
    );
  }
}
