import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireUser, writeAuditLog } from '@/lib/auth';
import { notifyOrderEvent } from '@/lib/notifications';
import { statusFromError } from '@/lib/permissions';
import {
  canPerformAction,
  getNextStatusAfterBaohanhDone,
  getNextStatusAfterKithuatDone,
  shouldCompleteOrder,
} from '@/lib/state-machine';
import { OrderStatus } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireUser();
    const body = await request.json();
    const { action, note } = body;

    const ALLOWED_ACTIONS = [
      'receive_kho',
      'complete_kithuat',
      'complete_baohanh',
      'start_delivery',
      'complete_delivery',
    ] as const;
    if (!ALLOWED_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Action không hợp lệ' }, { status: 400 });
    }

    const db = getDb();
    const orderRow = await db
      .prepare('SELECT id, invoice_no, status, payment_status, tags, sales_user_id FROM orders WHERE id = ?')
      .bind(id)
      .first<any>();

    if (!orderRow) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    let parsedTags: string[] = [];
    try {
      parsedTags = JSON.parse(orderRow.tags || '[]');
    } catch {
      parsedTags = [];
    }

    const currentStatus: OrderStatus = orderRow.status;
    let nextStatus: OrderStatus = currentStatus;
    let defaultNote = (typeof note === 'string' ? note : '').slice(0, 1000);

    // Handle standard role actions
    if (action === 'receive_kho') {
      if (!canPerformAction(currentUser.roles, 'receive_kho', currentStatus)) {
        return NextResponse.json({ error: 'Không có quyền tiếp nhận đơn vào kho' }, { status: 403 });
      }
      nextStatus = 'kho_pending';
      defaultNote = defaultNote || 'Kho đã tiếp nhận đơn hàng, sẵn sàng xuất';
    } else if (action === 'complete_kithuat') {
      if (!canPerformAction(currentUser.roles, 'complete_kithuat', currentStatus)) {
        return NextResponse.json(
          { error: 'Chỉ kỹ thuật viên hoặc Admin mới có quyền xác nhận hoàn thành kỹ thuật' },
          { status: 403 }
        );
      }
      // Record kithuat_done, then route to next state (baohanh_pending or ship_pending)
      const afterKithuat = getNextStatusAfterKithuatDone(parsedTags);
      
      // Log kithuat_done first
      const histId1 = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await db
        .prepare(
          `INSERT INTO order_status_history (id, order_id, status, changed_by_user_id, note)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(
          histId1,
          id,
          'kithuat_done',
          currentUser.id,
          defaultNote || 'Kỹ thuật viên đã kiểm tra, lắp ráp, cài đặt và test máy thành công'
        )
        .run();

      nextStatus = afterKithuat;
      defaultNote =
        afterKithuat === 'baohanh_pending'
          ? 'Chuyển sang bộ phận Bảo Hành theo tag bảo hành'
          : 'Chuyển sang bộ phận Giao Hàng (kỹ thuật hoàn tất)';
    } else if (action === 'complete_baohanh') {
      if (!canPerformAction(currentUser.roles, 'complete_baohanh', currentStatus)) {
        return NextResponse.json(
          { error: 'Chỉ nhân viên bảo hành hoặc Admin mới có quyền xác nhận bảo hành' },
          { status: 403 }
        );
      }
      const afterBaohanh = getNextStatusAfterBaohanhDone();

      // Log baohanh_done first
      const histId1 = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await db
        .prepare(
          `INSERT INTO order_status_history (id, order_id, status, changed_by_user_id, note)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(
          histId1,
          id,
          'baohanh_done',
          currentUser.id,
          defaultNote || 'Bảo hành đã kiểm tra/xử lý/đổi mới linh kiện hoàn tất'
        )
        .run();

      nextStatus = afterBaohanh;
      defaultNote = 'Chuyển sang bộ phận Giao Hàng (bảo hành hoàn tất)';
    } else if (action === 'start_delivery') {
      if (!canPerformAction(currentUser.roles, 'start_delivery', currentStatus)) {
        return NextResponse.json({ error: 'Không có quyền nhận đơn đi giao' }, { status: 403 });
      }
      nextStatus = 'ship_dangiao';
      defaultNote = defaultNote || 'Shipper đã lấy hàng và đang trên đường đi giao';
    } else if (action === 'complete_delivery') {
      if (!canPerformAction(currentUser.roles, 'complete_delivery', currentStatus)) {
        return NextResponse.json({ error: 'Không có quyền xác nhận giao hàng' }, { status: 403 });
      }
      nextStatus = 'ship_done';
      defaultNote = defaultNote || 'Shipper đã giao hàng thành công tới khách hàng';
    }

    // Auto-completion check: if ship_done AND payment_status === 'full' -> completed
    let isAutoCompleted = false;
    if (nextStatus === 'ship_done' && shouldCompleteOrder('ship_done', orderRow.payment_status)) {
      nextStatus = 'completed';
      isAutoCompleted = true;
    }

    // Update order status (atomic: chống double-submit đồng thời)
    const updateResult: any = await db
      .prepare(
        'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?'
      )
      .bind(nextStatus, id, currentStatus)
      .run();
    if ((updateResult?.meta?.changes ?? 1) === 0) {
      return NextResponse.json(
        { error: 'Trạng thái đơn đã thay đổi, vui lòng tải lại' },
        { status: 409 }
      );
    }

    // Log the resulting status history
    const histId = `hist_${Date.now() + 2}_${Math.random().toString(36).substring(2, 7)}`;
    const finalNote = isAutoCompleted
      ? `${defaultNote} — Đơn đã giao xong và thanh toán đủ 100%, hệ thống tự động hoàn tất đơn (completed)`
      : defaultNote || `Chuyển trạng thái sang ${nextStatus}`;

    await db
      .prepare(
        `INSERT INTO order_status_history (id, order_id, status, changed_by_user_id, note)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(histId, id, nextStatus, currentUser.id, finalNote)
      .run();

    await writeAuditLog({
      action: 'order_status_changed',
      actor: currentUser,
      targetUserId: null,
      targetName: orderRow.invoice_no,
      detail: { order_id: id, action, from: currentStatus, to: nextStatus },
      ip: request.headers.get('x-forwarded-for'),
    });

    // Tag người tạo đơn + nhóm phụ trách trạng thái mới (trừ người vừa làm)
    const ACTION_TITLES: Record<string, string> = {
      receive_kho: `Kho đã tiếp nhận ${orderRow.invoice_no}`,
      complete_kithuat: `Kỹ thuật đã xong ${orderRow.invoice_no}`,
      complete_baohanh: `Bảo hành đã xong ${orderRow.invoice_no}`,
      start_delivery: `Đang giao ${orderRow.invoice_no}`,
      complete_delivery: `Đã giao xong ${orderRow.invoice_no}`,
    };
    await notifyOrderEvent({
      actor: currentUser,
      orderId: id,
      invoiceNo: orderRow.invoice_no,
      salesUserId: orderRow.sales_user_id,
      kind: isAutoCompleted ? 'order_completed' : 'order_status',
      title: isAutoCompleted ? `Đơn ${orderRow.invoice_no} đã hoàn tất` : ACTION_TITLES[action] || `Đơn ${orderRow.invoice_no} chuyển sang ${nextStatus}`,
      message: finalNote.slice(0, 500),
      newStatus: nextStatus,
    });

    return NextResponse.json({
      success: true,
      orderId: id,
      newStatus: nextStatus,
      isAutoCompleted,
      message: `Đã cập nhật trạng thái đơn sang: ${nextStatus}`,
    });
  } catch (error: any) {
    console.error('Error changing order status:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi cập nhật trạng thái đơn' },
      { status: statusFromError(error) }
    );
  }
}
