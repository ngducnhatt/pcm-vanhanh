import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireUser, writeAuditLog } from '@/lib/auth';
import { notifyOrderEvent } from '@/lib/notifications';
import { can, statusFromError } from '@/lib/permissions';
import { fetchOrderDetail } from '@/lib/order-detail';
import {
  canCancelOrder,
  canEditOrder,
  requiresRollbackToKho,
} from '@/lib/state-machine';
import { Order, OrderItem, OrderStatus, OrderStatusHistory, Payment, Shipment } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireUser();

    const order = await fetchOrderDetail(id);
    if (!order) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { error: 'Lỗi tải chi tiết đơn hàng' },
      { status: statusFromError(error) }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireUser();

    if (!can(currentUser.roles, 'order:edit')) {
      return NextResponse.json(
        { error: 'Không có quyền sửa đơn hàng' },
        { status: 403 }
      );
    }

    const db = getDb();
    const currentOrder = await db
      .prepare('SELECT * FROM orders WHERE id = ?')
      .bind(id)
      .first<any>();

    if (!currentOrder) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    // Ownership: kinh_doanh chỉ sửa đơn của chính mình (admin bypass)
    if (
      currentUser.roles.includes('kinh_doanh') &&
      !currentUser.roles.includes('admin') &&
      currentOrder.sales_user_id !== currentUser.id
    ) {
      return NextResponse.json({ error: 'Chỉ được sửa đơn do chính mình tạo' }, { status: 403 });
    }

    if (!canEditOrder(currentOrder.status)) {
      return NextResponse.json(
        { error: `Không thể sửa đơn hàng ở trạng thái ${currentOrder.status}` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      customer_address,
      customer_email,
      tags,
      note,
      items, // array of { product_id, quantity, unit_price }
      reason = 'Điều chỉnh thông tin đơn hàng',
    } = body;
    let newStatus: OrderStatus = currentOrder.status;
    let didRollback = false;
    const changes: string[] = [];
    const actorLabel =
      currentUser.roles.includes('kho')
        ? 'Nhân viên Kho'
        : currentUser.roles.includes('kinh_doanh')
          ? 'Nhân viên Kinh doanh'
          : 'Admin';

    const addChange = (label: string, oldValue: unknown, newValue: unknown) => {
      const oldText = oldValue == null || oldValue === '' ? '—' : String(oldValue);
      const newText = newValue == null || newValue === '' ? '—' : String(newValue);
      if (oldText !== newText) changes.push(`${label}: ${oldText} → ${newText}`);
    };

    addChange('Khách hàng', currentOrder.customer_name, customer_name ?? currentOrder.customer_name);
    addChange('Số điện thoại', currentOrder.customer_phone, customer_phone ?? currentOrder.customer_phone);
    addChange('Địa chỉ', currentOrder.customer_address, customer_address ?? currentOrder.customer_address);
    addChange('Email', currentOrder.customer_email, customer_email ?? currentOrder.customer_email);
    addChange('Ghi chú', currentOrder.note, note ?? currentOrder.note);

    let currentItems: any[] = [];

    // Check if items changed
    if (items && Array.isArray(items)) {
      currentItems = (
        await db
          .prepare(
            `SELECT oi.id, oi.product_id, p.name as product_name, p.sku, oi.quantity, oi.unit_price, oi.serial_number, oi.warranty_months
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?`
          )
          .bind(id)
          .all<any>()
      ).results || [];

      const productIds = [...new Set(items.map((item: any) => item.product_id).filter(Boolean))];
      const products = productIds.length
        ? (await db
            .prepare(`SELECT id, name, sku FROM products WHERE id IN (${productIds.map(() => '?').join(', ')})`)
            .bind(...productIds)
            .all<any>()).results || []
        : [];
      const productById = new Map(products.map((product: any) => [product.id, product]));
      const oldDescription = currentItems.map((item) =>
        `${item.product_name || item.sku || item.product_id} ×${item.quantity} (${item.unit_price.toLocaleString('vi-VN')}đ, BH ${item.warranty_months ?? 36} tháng${item.serial_number ? `, SN ${item.serial_number}` : ''})`
      ).join('; ') || 'Không có';
      const newDescription = items.map((item: any) => {
        const product = productById.get(item.product_id);
        return `${product?.name || product?.sku || item.product_id} ×${item.quantity || 1} (${Number(item.unit_price || 0).toLocaleString('vi-VN')}đ, BH ${item.warranty_months ?? 36} tháng${item.serial_number ? `, SN ${item.serial_number}` : ''})`;
      }).join('; ') || 'Không có';
      addChange('Danh sách hàng hóa', oldDescription, newDescription);

      // Check if rollback is required (status >= kho_done)
      if (requiresRollbackToKho(currentOrder.status)) {
        didRollback = true;
        newStatus = 'kho_pending';

        // Capture the previous item and serial state before rollback.
        const snapshotSerials = JSON.stringify(
          currentItems.map((item) => ({
            product_id: item.product_id,
            sku: item.sku,
            name: item.product_name,
            quantity: item.quantity,
            serial_number: item.serial_number,
            warranty_months: item.warranty_months,
          }))
        );

        // 2. Record rollback in order_status_history with snapshot_serials
        const historyId = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await db
          .prepare(
            `INSERT INTO order_status_history (
              id, order_id, status, changed_by_user_id, note, snapshot_serials, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
          )
          .bind(
            historyId,
            id,
            newStatus,
            currentUser.id,
            `Rollback về Chờ xuất kho do ${actorLabel} sửa số lượng/sản phẩm: ${reason}`,
            snapshotSerials
          )
          .run();
      }

      // 3. Replace order items with new items
      await db.prepare('DELETE FROM order_items WHERE order_id = ?').bind(id).run();

      let newTotal = 0;
      for (const item of items) {
        const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const qty = item.quantity || 1;
        const price = item.unit_price || 0;
        newTotal += qty * price;

        await db
          .prepare(
            `INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, serial_number, warranty_months)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            itemId,
            id,
            item.product_id,
            qty,
            price,
            item.serial_number || null,
            item.warranty_months ?? 36
          )
          .run();
      }

      // Re-evaluate payment status against new total
      let newPaymentStatus = currentOrder.payment_status;
      if (currentOrder.paid_amount >= newTotal && newTotal > 0) {
        newPaymentStatus = 'full';
      } else if (currentOrder.paid_amount > 0) {
        newPaymentStatus = 'partial';
      } else {
        newPaymentStatus = 'unpaid';
      }

      // Update orders table
      const tagsJson = tags ? JSON.stringify(tags) : currentOrder.tags;
      addChange('Tags quy trình', currentOrder.tags, tagsJson);
      await db
        .prepare(
          `UPDATE orders
           SET customer_name = COALESCE(?, customer_name),
               customer_phone = COALESCE(?, customer_phone),
               customer_email = COALESCE(?, customer_email),
               customer_address = COALESCE(?, customer_address),
               tags = ?,
               note = COALESCE(?, note),
               status = ?,
               payment_status = ?,
               total_amount = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`
        )
        .bind(
          customer_name || null,
          customer_phone || null,
          customer_email === undefined ? null : customer_email,
          customer_address === undefined ? null : customer_address,
          tagsJson,
          note === undefined ? null : note,
          newStatus,
          newPaymentStatus,
          newTotal,
          id
        )
        .run();
    } else {
      // Items not changed, only customer info or tags updated
      const tagsJson = tags ? JSON.stringify(tags) : currentOrder.tags;
      addChange('Tags quy trình', currentOrder.tags, tagsJson);
      await db
        .prepare(
          `UPDATE orders
           SET customer_name = COALESCE(?, customer_name),
               customer_phone = COALESCE(?, customer_phone),
               customer_email = COALESCE(?, customer_email),
               customer_address = COALESCE(?, customer_address),
               tags = ?,
               note = COALESCE(?, note),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`
        )
        .bind(
          customer_name || null,
          customer_phone || null,
          customer_email === undefined ? null : customer_email,
          customer_address === undefined ? null : customer_address,
          tagsJson,
          note === undefined ? null : note,
          id
        )
        .run();
    }

    const historyId = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const details = changes.length ? ` Thay đổi: ${changes.join(' | ')}` : ' Không có trường dữ liệu nào thay đổi.';
    await db
      .prepare(
        `INSERT INTO order_status_history (id, order_id, status, changed_by_user_id, note)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        historyId,
        id,
        newStatus,
        currentUser.id,
        `${actorLabel} cập nhật đơn hàng. Lý do: ${String(reason).slice(0, 500)}.${details}${didRollback ? ' Quy trình đã rollback về Chờ xuất kho.' : ''}`
      )
      .run();

    await writeAuditLog({
      action: 'order_updated',
      actor: currentUser,
      targetUserId: null,
      targetName: currentOrder.invoice_no,
      detail: { order_id: id, rollback: didRollback, changes: changes.slice(0, 10) },
      ip: request.headers.get('x-forwarded-for'),
    });

    // Tag người tạo đơn khi bị sửa (trừ người tự sửa); rollback thì tag thêm kho
    await notifyOrderEvent({
      actor: currentUser,
      orderId: id,
      invoiceNo: currentOrder.invoice_no,
      salesUserId: currentOrder.sales_user_id,
      kind: didRollback ? 'order_rollback' : 'order_edited',
      title: didRollback
        ? `Đơn ${currentOrder.invoice_no} bị sửa và trả về kho`
        : `Đơn ${currentOrder.invoice_no} vừa được sửa`,
      message: `${actorLabel}: ${String(reason).slice(0, 200)}`,
      newStatus: didRollback ? 'kho_pending' : null,
    });

    return NextResponse.json({
      success: true,
      orderId: id,
      newStatus,
      didRollback,
      message: didRollback
        ? 'Đã sửa đơn hàng và tự động Rollback trạng thái về Chờ xuất kho (kho_pending)!'
        : 'Cập nhật thông tin đơn hàng thành công!',
    });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật đơn hàng' },
      { status: statusFromError(error) }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireUser();

    if (!can(currentUser.roles, 'order:cancel')) {
      return NextResponse.json(
        { error: 'Không có quyền hủy đơn hàng' },
        { status: 403 }
      );
    }

    const db = getDb();
    const currentOrder = await db
      .prepare('SELECT id, invoice_no, status, sales_user_id FROM orders WHERE id = ?')
      .bind(id)
      .first<any>();

    if (!currentOrder) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    // Ownership: kinh_doanh chỉ hủy đơn của chính mình (admin bypass)
    if (
      currentUser.roles.includes('kinh_doanh') &&
      !currentUser.roles.includes('admin') &&
      currentOrder.sales_user_id !== currentUser.id
    ) {
      return NextResponse.json({ error: 'Chỉ được hủy đơn do chính mình tạo' }, { status: 403 });
    }

    if (!canCancelOrder(currentOrder.status)) {
      return NextResponse.json(
        { error: `Không thể hủy đơn hàng đã hoàn tất (${currentOrder.status})` },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reason = (searchParams.get('reason') || 'Kinh doanh hủy đơn theo yêu cầu').slice(0, 500);

    // Hủy đơn: chuyển cancelled + dọn shipment chờ (tránh kẹt shipper) trong 1 luồng
    await db
      .prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status != ?')
      .bind('cancelled', id, 'completed')
      .run();
    await db.prepare('DELETE FROM shipments WHERE order_id = ?').bind(id).run();

    // Insert history
    const historyId = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db
      .prepare(
        `INSERT INTO order_status_history (id, order_id, status, changed_by_user_id, note)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(historyId, id, 'cancelled', currentUser.id, `Hủy đơn: ${reason}`)
      .run();

    await writeAuditLog({
      action: 'order_cancelled',
      actor: currentUser,
      targetUserId: null,
      targetName: currentOrder.invoice_no,
      detail: { order_id: id, reason },
      ip: request.headers.get('x-forwarded-for'),
    });

    // Tag người tạo đơn khi đơn bị hủy (trừ người tự hủy)
    await notifyOrderEvent({
      actor: currentUser,
      orderId: id,
      invoiceNo: currentOrder.invoice_no,
      salesUserId: currentOrder.sales_user_id,
      kind: 'order_cancelled',
      title: `Đơn ${currentOrder.invoice_no} đã bị hủy`,
      message: `Lý do: ${reason}`,
    });

    return NextResponse.json({
      success: true,
      message: `Đơn hàng ${currentOrder.invoice_no} đã được hủy thành công!`,
    });
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Lỗi hủy đơn hàng' },
      { status: statusFromError(error) }
    );
  }
}
