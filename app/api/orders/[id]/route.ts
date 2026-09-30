import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { can, statusFromError } from '@/lib/permissions';
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
    const db = getDb();

    // 1. Fetch order
    const orderRow = await db
      .prepare(
        `SELECT o.*, u.name as sales_user_name, u.email as sales_user_email
         FROM orders o
         LEFT JOIN users u ON o.sales_user_id = u.id
         WHERE o.id = ?`
      )
      .bind(id)
      .first<any>();

    if (!orderRow) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    // 2. Fetch items
    const itemsRows = (
      await db
        .prepare(
          `SELECT oi.*, p.sku as product_sku, p.name as product_name, p.category as product_category, p.stock_qty as product_stock_qty
           FROM order_items oi
           LEFT JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = ?
           ORDER BY oi.created_at ASC`
        )
        .bind(id)
        .all<any>()
    ).results || [];

    const items: OrderItem[] = itemsRows.map((row) => ({
      id: row.id,
      order_id: row.order_id,
      product_id: row.product_id,
      quantity: row.quantity,
      unit_price: row.unit_price,
      warranty_months: row.warranty_months ?? 36,
      serial_number: row.serial_number,
      created_at: row.created_at,
      product: {
        id: row.product_id,
        sku: row.product_sku || '',
        name: row.product_name || '',
        unit_price: row.unit_price,
        stock_qty: row.product_stock_qty || 0,
        category: row.product_category,
      },
    }));

    // 3. Fetch history
    const historyRows = (
      await db
        .prepare(
          `SELECT h.*, u.name as user_name, u.role as user_role
           FROM order_status_history h
           LEFT JOIN users u ON h.changed_by_user_id = u.id
           WHERE h.order_id = ?
           ORDER BY h.created_at DESC`
        )
        .bind(id)
        .all<any>()
    ).results || [];

    const history: OrderStatusHistory[] = historyRows.map((row) => ({
      id: row.id,
      order_id: row.order_id,
      status: row.status,
      changed_by_user_id: row.changed_by_user_id,
      note: row.note,
      snapshot_serials: row.snapshot_serials,
      created_at: row.created_at,
      changed_by_user: {
        id: row.changed_by_user_id,
        name: row.user_name || 'Hệ thống',
        email: '',
        role: row.user_role || 'admin',
        is_active: 1,
        created_at: '',
      },
    }));

    // 4. Fetch payments
    const paymentRows = (
      await db
        .prepare(
          `SELECT p.*, u.name as collected_user_name
           FROM payments p
           LEFT JOIN users u ON p.collected_by_user_id = u.id
           WHERE p.order_id = ?
           ORDER BY p.paid_at DESC`
        )
        .bind(id)
        .all<any>()
    ).results || [];

    const payments: Payment[] = paymentRows.map((row) => ({
      id: row.id,
      order_id: row.order_id,
      method: row.method,
      amount: row.amount,
      collected_by_user_id: row.collected_by_user_id,
      paid_at: row.paid_at,
      collected_by_user: {
        id: row.collected_by_user_id,
        name: row.collected_user_name || 'Nhân viên',
        email: '',
        role: 'kinh_doanh',
        is_active: 1,
        created_at: '',
      },
    }));

    // 5. Fetch shipment
    const shipmentRow = await db
      .prepare(
        `SELECT s.*, sh.name as shipper_name, sh.phone as shipper_phone, u.name as assigned_user_name
         FROM shipments s
         LEFT JOIN users sh ON s.shipper_id = sh.id
         LEFT JOIN users u ON s.assigned_by_user_id = u.id
         WHERE s.order_id = ?`
      )
      .bind(id)
      .first<any>();

    const shipment: Shipment | null = shipmentRow
      ? {
          id: shipmentRow.id,
          order_id: shipmentRow.order_id,
          shipper_id: shipmentRow.shipper_id,
          assigned_by_user_id: shipmentRow.assigned_by_user_id,
          address: shipmentRow.address,
          distance_km: shipmentRow.distance_km,
          km_source: shipmentRow.km_source,
          created_at: shipmentRow.created_at,
          shipper: {
            id: shipmentRow.shipper_id,
            name: shipmentRow.shipper_name || 'Shipper',
            phone: shipmentRow.shipper_phone,
            email: '',
            role: 'shipper',
            is_active: 1,
            created_at: '',
          },
          assigned_by_user: {
            id: shipmentRow.assigned_by_user_id,
            name: shipmentRow.assigned_user_name || 'Quản lý ship',
            email: '',
            role: 'quan_ly_ship',
            is_active: 1,
            created_at: '',
          },
        }
      : null;

    let parsedTags: string[] = [];
    try {
      parsedTags = JSON.parse(orderRow.tags || '[]');
    } catch {
      parsedTags = [];
    }

    const order: Order = {
      id: orderRow.id,
      invoice_no: orderRow.invoice_no,
      invoice_date: orderRow.invoice_date,
      customer_name: orderRow.customer_name,
      customer_phone: orderRow.customer_phone,
      customer_address: orderRow.customer_address,
      customer_email: orderRow.customer_email,
      tags: parsedTags,
      note: orderRow.note,
      sales_user_id: orderRow.sales_user_id,
      status: orderRow.status,
      payment_status: orderRow.payment_status,
      related_order_id: orderRow.related_order_id,
      total_amount: orderRow.total_amount,
      paid_amount: orderRow.paid_amount,
      created_at: orderRow.created_at,
      updated_at: orderRow.updated_at,
      sales_user: {
        id: orderRow.sales_user_id,
        name: orderRow.sales_user_name || 'Kinh doanh',
        email: orderRow.sales_user_email || '',
        role: 'kinh_doanh',
        is_active: 1,
        created_at: '',
      },
      items,
      history,
      payments,
      shipment,
    };

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi tải chi tiết đơn hàng' },
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
        `${actorLabel} cập nhật đơn hàng. Lý do: ${reason}.${details}${didRollback ? ' Quy trình đã rollback về Chờ xuất kho.' : ''}`
      )
      .run();

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
      { error: error.message || 'Lỗi cập nhật đơn hàng' },
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
      .prepare('SELECT id, invoice_no, status FROM orders WHERE id = ?')
      .bind(id)
      .first<any>();

    if (!currentOrder) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    if (!canCancelOrder(currentOrder.status)) {
      return NextResponse.json(
        { error: `Không thể hủy đơn hàng đã hoàn tất (${currentOrder.status})` },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason') || 'Kinh doanh hủy đơn theo yêu cầu';

    // Update status to cancelled
    await db
      .prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind('cancelled', id)
      .run();

    // Insert history
    const historyId = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db
      .prepare(
        `INSERT INTO order_status_history (id, order_id, status, changed_by_user_id, note)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(historyId, id, 'cancelled', currentUser.id, `Hủy đơn: ${reason}`)
      .run();

    return NextResponse.json({
      success: true,
      message: `Đơn hàng ${currentOrder.invoice_no} đã được hủy thành công!`,
    });
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi hủy đơn hàng' },
      { status: statusFromError(error) }
    );
  }
}
