import { NextRequest, NextResponse } from 'next/server';
import { logServerError, toSafeError } from '@/lib/api-error';
import { getDb, withTransaction, affectedRows } from '@/lib/db';
import { requirePermission, writeAuditLog } from '@/lib/auth';
import { notifyOrderEvent } from '@/lib/notifications';
import { statusFromError } from '@/lib/permissions';
import { getClientIp } from '@/lib/request-ip';
import { OrderStatus } from '@/lib/types';

interface ShipmentOrderRow {
  id: string;
  invoice_no: string;
  status: OrderStatus;
  sales_user_id: string;
}

interface ShipperRow {
  id: string;
  name: string;
}


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requirePermission('order:assign_ship');

    if (!currentUser.roles.includes('quan_ly_ship') && !currentUser.roles.includes('admin')) {
      return NextResponse.json(
        { error: 'Chỉ Quản Lý Ship hoặc Admin mới có quyền phân công vận chuyển' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { shipper_id, address, distance_km, km_source = 'manual', note } = body;

    if (!shipper_id || !address?.trim() || distance_km === undefined) {
      return NextResponse.json(
        { error: 'Vui lòng chọn shipper, nhập địa chỉ và số km vận chuyển' },
        { status: 400 }
      );
    }
    const km = Number(distance_km);
    if (!Number.isFinite(km) || km < 0 || km > 5000) {
      return NextResponse.json({ error: 'Số km phải từ 0 đến 5000' }, { status: 400 });
    }
    if (!['gg_map', 'manual'].includes(km_source)) {
      return NextResponse.json({ error: 'Nguồn km không hợp lệ' }, { status: 400 });
    }

    const db = getDb();
    const [orderRow, shipperRow] = await Promise.all([
      db.prepare('SELECT id, invoice_no, status, sales_user_id FROM orders WHERE id = ?').bind(id).first<ShipmentOrderRow>(),
      db.prepare('SELECT u.id, u.name FROM users u INNER JOIN user_roles ur ON u.id = ur.user_id AND ur.role = ? WHERE u.id = ? AND u.is_active = 1').bind('shipper', shipper_id).first<ShipperRow>(),
    ]);

    if (!orderRow) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    // Chỉ gán ship khi đang chờ gán (chống ghi đè completed/cancelled/dangiao)
    if (orderRow.status !== 'ship_pending') {
      return NextResponse.json(
        { error: `Chỉ gán shipper khi đơn ở trạng thái ship_pending (hiện tại: ${orderRow.status})` },
        { status: 400 }
      );
    }

    if (!shipperRow) {
      return NextResponse.json({ error: 'Shipper không tồn tại hoặc không có quyền shipper' }, { status: 404 });
    }

    // Check existing shipment
    const existingShipment = await db
      .prepare('SELECT id FROM shipments WHERE order_id = ?')
      .bind(id)
      .first<{ id: string }>();

    const shipmentId =
      existingShipment?.id || `ship_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const histId = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sourceLabel = km_source === 'gg_map' ? 'Google Maps' : 'Nhập tay';

    /**
     * Ghi shipment + đổi trạng thái đơn + ghi lịch sử trong MỘT transaction.
     * Nếu `UPDATE orders ... WHERE status = 'ship_pending'` không ảnh hưởng dòng nào
     * (đơn đã bị chuyển trạng thái bởi request khác) -> rollback toàn bộ, trả 409.
     */
    const assigned = await withTransaction(async (query) => {
      if (existingShipment) {
        await query(
          `UPDATE shipments
           SET shipper_id = ?, assigned_by_user_id = ?, address = ?, distance_km = ?, km_source = ?
           WHERE id = ?`,
          [
            shipper_id,
            currentUser.id,
            address.trim(),
            Number(distance_km),
            km_source,
            shipmentId,
          ]
        );
      } else {
        await query(
          `INSERT INTO shipments (
            id, order_id, shipper_id, assigned_by_user_id, address, distance_km, km_source, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            shipmentId,
            id,
            shipper_id,
            currentUser.id,
            address.trim(),
            Number(distance_km),
            km_source,
          ]
        );
      }

      // Update order status to ship_assigned (atomic theo trạng thái hiện tại)
      const shipUpdate = await query(
        'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?',
        ['ship_assigned', id, 'ship_pending']
      );
      if (affectedRows(shipUpdate) === 0) {
        return false;
      }

      // Log history
      await query(
        `INSERT INTO order_status_history (id, order_id, status, changed_by_user_id, note)
         VALUES (?, ?, ?, ?, ?)`,
        [
          histId,
          id,
          'ship_assigned',
          currentUser.id,
          `Quản lý ship phân công shipper ${shipperRow.name} (${km} km - ${sourceLabel}). ${note ? `Ghi chú: ${String(note).slice(0, 500)}` : ''}`,
        ]
      );
      return true;
    });

    if (!assigned) {
      return NextResponse.json(
        { error: 'Trạng thái đơn đã thay đổi, vui lòng tải lại' },
        { status: 409 }
      );
    }

    await writeAuditLog({
      action: 'order_shipment_assigned',
      actor: currentUser,
      targetUserId: null,
      targetName: orderRow.invoice_no,
      detail: { order_id: id, shipper_id, distance_km: km },
      ip: getClientIp(request),
    });

    // Tag shipper được gán + người tạo đơn
    await notifyOrderEvent({
      actor: currentUser,
      orderId: id,
      invoiceNo: orderRow.invoice_no,
      salesUserId: orderRow.sales_user_id,
      shipperId: shipper_id,
      kind: 'order_shipment',
      title: `Bạn được gán giao ${orderRow.invoice_no}`,
      message: `${shipperRow.name} giao ${km} km — ${String(address).slice(0, 120)}`,
    });

    return NextResponse.json({
      success: true,
      orderId: id,
      status: 'ship_assigned',
      message: `Đã phân công giao hàng cho ${shipperRow.name} thành công!`,
    });
  } catch (error: unknown) {
    console.error('Error assigning shipment:', error);
    const safe = toSafeError(error, 'Lỗi phân công vận chuyển');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
