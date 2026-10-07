import { NextRequest, NextResponse } from 'next/server';
import { getDb, withTransaction } from '@/lib/db';
import { requirePermission, writeAuditLog } from '@/lib/auth';
import { notifyOrderEvent } from '@/lib/notifications';
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

    const paymentAmount = Math.floor(Number(amount));
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
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
      .prepare('SELECT id, invoice_no, status, total_amount, paid_amount, sales_user_id FROM orders WHERE id = ?')
      .bind(id)
      .first<any>();

    if (!orderRow) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    // Chặn thu tiền trên đơn đã hủy / hoàn tất
    if (orderRow.status === 'cancelled' || orderRow.status === 'completed') {
      return NextResponse.json(
        { error: `Không thể thu tiền cho đơn đã ${orderRow.status}` },
        { status: 400 }
      );
    }

    // 1-3. Ghi payment + tính lại tổng trong transaction (chống double payments song song)
    const paidResult = await withTransaction(async (query) => {
      const paymentId = `pay_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`;
      await query(
        `INSERT INTO payments (id, order_id, method, amount, collected_by_user_id, paid_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [paymentId, id, method as PaymentMethod, paymentAmount, currentUser.id]
      );
      const sumRows: any = await query('SELECT SUM(amount) as total_paid FROM payments WHERE order_id = ?', [id]);
      const newPaidAmount = Number(sumRows?.[0]?.total_paid || 0);
      let newPaymentStatus: PaymentStatus = 'unpaid';
      if (newPaidAmount >= orderRow.total_amount && orderRow.total_amount > 0) {
        newPaymentStatus = 'full';
      } else if (newPaidAmount > 0) {
        newPaymentStatus = 'partial';
      }
      let newOrderStatus = orderRow.status;
      let isAutoCompleted = false;
      if (shouldCompleteOrder(orderRow.status, newPaymentStatus)) {
        newOrderStatus = 'completed';
        isAutoCompleted = true;
      }
      await query(
        `UPDATE orders SET paid_amount = ?, payment_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [newPaidAmount, newPaymentStatus, newOrderStatus, id]
      );
      const histId1 = `hist_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`;
      const methodLabel = method === 'qr' ? 'QR Code' : method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản';
      await query(
        `INSERT INTO order_status_history (id, order_id, status, changed_by_user_id, note) VALUES (?, ?, ?, ?, ?)`,
        [histId1, id, orderRow.status, currentUser.id, `Thu ${paymentAmount.toLocaleString()}đ qua ${methodLabel}. Trạng thái thanh toán: ${newPaymentStatus === 'full' ? 'Đã đủ 100%' : 'Một phần'}. ${note ? `(${String(note).slice(0, 500)})` : ''}`]
      );
      if (isAutoCompleted) {
        const histId2 = `hist_${Date.now() + 1}_${Math.random().toString(36).substring(2, 7)}`;
        await query(
          `INSERT INTO order_status_history (id, order_id, status, changed_by_user_id, note) VALUES (?, ?, ?, ?, ?)`,
          [histId2, id, 'completed', currentUser.id, 'Đơn hàng đã giao xong và khách thanh toán đủ tiền -> Hệ thống tự động chuyển sang Hoàn tất (completed)']
        );
      }
      return { newPaidAmount, newPaymentStatus, newOrderStatus, isAutoCompleted };
    });

    const { newPaidAmount, newPaymentStatus, newOrderStatus, isAutoCompleted } = paidResult;

    await writeAuditLog({
      action: 'order_payment_collected',
      actor: currentUser,
      targetUserId: null,
      targetName: orderRow.invoice_no,
      detail: { order_id: id, amount: paymentAmount, method },
      ip: request.headers.get('x-forwarded-for'),
    });

    // Tag người tạo đơn khi có tiền về (trừ người vừa thu)
    await notifyOrderEvent({
      actor: currentUser,
      orderId: id,
      invoiceNo: orderRow.invoice_no,
      salesUserId: orderRow.sales_user_id,
      kind: 'order_payment',
      title: `Đã thu ${paymentAmount.toLocaleString('vi-VN')}đ (${orderRow.invoice_no})`,
      message: `${currentUser.name} thu qua ${method === 'qr' ? 'QR' : method === 'cash' ? 'tiền mặt' : 'chuyển khoản'}`,
    });

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
