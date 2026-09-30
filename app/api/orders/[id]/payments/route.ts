import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { statusFromError } from '@/lib/permissions';
import { shouldCompleteOrder } from '@/lib/state-machine';
import { PaymentMethod, PaymentStatus } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requirePermission('order:collect_payment');

    // Check permission (kinh_doanh, shipper, admin)
    if (
      !currentUser.roles.includes('kinh_doanh') &&
      !currentUser.roles.includes('shipper') &&
      !currentUser.roles.includes('admin')
    ) {
      return NextResponse.json(
        { error: 'Chỉ nhân viên Kinh Doanh, Shipper hoặc Admin mới có quyền thu tiền' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { method, amount, note } = body;

    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      return NextResponse.json({ error: 'Số tiền thu phải lớn hơn 0' }, { status: 400 });
    }

    if (!['qr', 'cash', 'transfer'].includes(method)) {
      return NextResponse.json(
        { error: 'Phương thức thanh toán phải là qr, cash hoặc transfer' },
        { status: 400 }
      );
    }

    const db = getDb();
    const orderRow = await db
      .prepare('SELECT id, invoice_no, status, total_amount, paid_amount FROM orders WHERE id = ?')
      .bind(id)
      .first<any>();

    if (!orderRow) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    // 1. Insert payment record
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db
      .prepare(
        `INSERT INTO payments (id, order_id, method, amount, collected_by_user_id, paid_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      )
      .bind(paymentId, id, method as PaymentMethod, paymentAmount, currentUser.id)
      .run();

    // 2. Calculate new total paid
    const sumRow = await db
      .prepare('SELECT SUM(amount) as total_paid FROM payments WHERE order_id = ?')
      .bind(id)
      .first<{ total_paid: number }>();

    const newPaidAmount = Number(sumRow?.total_paid || 0);
    let newPaymentStatus: PaymentStatus = 'unpaid';

    if (newPaidAmount >= orderRow.total_amount && orderRow.total_amount > 0) {
      newPaymentStatus = 'full';
    } else if (newPaidAmount > 0) {
      newPaymentStatus = 'partial';
    }

    // 3. Check auto completion: if ship_done AND payment_status === 'full' -> completed
    let isAutoCompleted = false;
    let newOrderStatus = orderRow.status;

    if (shouldCompleteOrder(orderRow.status, newPaymentStatus)) {
      newOrderStatus = 'completed';
      isAutoCompleted = true;
    }

    // Update order
    await db
      .prepare(
        `UPDATE orders
         SET paid_amount = ?,
             payment_status = ?,
             status = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .bind(newPaidAmount, newPaymentStatus, newOrderStatus, id)
      .run();

    // 4. Log status history for payment and auto-completion
    const histId1 = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const methodLabel = method === 'qr' ? 'QR Code' : method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản';
    await db
      .prepare(
        `INSERT INTO order_status_history (id, order_id, status, changed_by_user_id, note)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        histId1,
        id,
        orderRow.status,
        currentUser.id,
        `Thu ${paymentAmount.toLocaleString()}đ qua ${methodLabel}. Trạng thái thanh toán: ${newPaymentStatus === 'full' ? 'Đã đủ 100%' : 'Một phần'}. ${note ? `(${note})` : ''}`
      )
      .run();

    if (isAutoCompleted) {
      const histId2 = `hist_${Date.now() + 1}_${Math.random().toString(36).substring(2, 7)}`;
      await db
        .prepare(
          `INSERT INTO order_status_history (id, order_id, status, changed_by_user_id, note)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(
          histId2,
          id,
          'completed',
          currentUser.id,
          'Đơn hàng đã giao xong và khách thanh toán đủ tiền -> Hệ thống tự động chuyển sang Hoàn tất (completed)'
        )
        .run();
    }

    return NextResponse.json({
      success: true,
      orderId: id,
      newPaidAmount,
      newPaymentStatus,
      newOrderStatus,
      isAutoCompleted,
      message: `Đã ghi nhận thanh toán ${paymentAmount.toLocaleString()}đ thành công!`,
    });
  } catch (error: any) {
    console.error('Error adding payment:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi ghi nhận thanh toán' },
      { status: statusFromError(error) }
    );
  }
}
