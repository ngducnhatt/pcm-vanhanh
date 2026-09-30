import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { statusFromError } from '@/lib/permissions';

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

    if (!shipper_id || !address || distance_km === undefined) {
      return NextResponse.json(
        { error: 'Vui lòng chọn shipper, nhập địa chỉ và số km vận chuyển' },
        { status: 400 }
      );
    }

    const db = getDb();
    const [orderRow, shipperRow] = await Promise.all([
      db.prepare('SELECT id, invoice_no, status FROM orders WHERE id = ?').bind(id).first<any>(),
      db.prepare('SELECT id, name, role FROM users WHERE id = ?').bind(shipper_id).first<any>(),
    ]);

    if (!orderRow) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    if (!shipperRow) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin shipper' }, { status: 404 });
    }

    // Check existing shipment
    const existingShipment = await db
      .prepare('SELECT id FROM shipments WHERE order_id = ?')
      .bind(id)
      .first<any>();

    const shipmentId =
      existingShipment?.id || `ship_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (existingShipment) {
      await db
        .prepare(
          `UPDATE shipments
           SET shipper_id = ?, assigned_by_user_id = ?, address = ?, distance_km = ?, km_source = ?
           WHERE id = ?`
        )
        .bind(
          shipper_id,
          currentUser.id,
          address.trim(),
          Number(distance_km),
          km_source,
          shipmentId
        )
        .run();
    } else {
      await db
        .prepare(
          `INSERT INTO shipments (
            id, order_id, shipper_id, assigned_by_user_id, address, distance_km, km_source, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        )
        .bind(
          shipmentId,
          id,
          shipper_id,
          currentUser.id,
          address.trim(),
          Number(distance_km),
          km_source
        )
        .run();
    }

    // Update order status to ship_assigned
    await db
      .prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind('ship_assigned', id)
      .run();

    // Log history
    const histId = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sourceLabel = km_source === 'gg_map' ? 'Google Maps' : 'Nhập tay';
    await db
      .prepare(
        `INSERT INTO order_status_history (id, order_id, status, changed_by_user_id, note)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        histId,
        id,
        'ship_assigned',
        currentUser.id,
        `Quản lý ship phân công shipper ${shipperRow.name} (${distance_km} km - ${sourceLabel}). ${note ? `Ghi chú: ${note}` : ''}`
      )
      .run();

    return NextResponse.json({
      success: true,
      orderId: id,
      status: 'ship_assigned',
      message: `Đã phân công giao hàng cho ${shipperRow.name} thành công!`,
    });
  } catch (error: any) {
    console.error('Error assigning shipment:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi phân công vận chuyển' },
      { status: statusFromError(error) }
    );
  }
}
