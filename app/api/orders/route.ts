import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { can, statusFromError } from '@/lib/permissions';
import { getRoleQueueStatuses } from '@/lib/state-machine';
import { Order, OrderItem, OrderStatus, PaymentStatus, Role } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as OrderStatus | null;
    const roleQueue = searchParams.get('role_queue') as Role | null;
    const search = searchParams.get('search')?.trim() || '';
    const tag = searchParams.get('tag')?.trim() || '';
    const paymentStatus = searchParams.get('payment_status') as PaymentStatus | null;
    const shipperId = searchParams.get('shipper_id')?.trim() || '';

    const db = getDb();
    const currentUser = await requireUser();

    let query = `
      SELECT 
        o.id, o.invoice_no, o.invoice_date, o.customer_name, o.customer_phone, o.customer_address,
        o.customer_email, o.tags, o.note, o.sales_user_id, o.status, 
        o.payment_status, o.related_order_id, o.total_amount, o.paid_amount, 
        o.created_at, o.updated_at,
        u.name as sales_user_name, u.email as sales_user_email,
        s.shipper_id, s.address as shipping_address, s.distance_km as shipping_distance_km,
        sh.name as shipper_name
      FROM orders o
      LEFT JOIN users u ON o.sales_user_id = u.id
      LEFT JOIN shipments s ON o.id = s.order_id
      LEFT JOIN users sh ON s.shipper_id = sh.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Filter by specific status
    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    } else if (roleQueue) {
      // Role queue statuses
      const queueStatuses = getRoleQueueStatuses(roleQueue);
      if (queueStatuses && queueStatuses.length > 0) {
        query += ` AND o.status IN (${queueStatuses.map(() => '?').join(', ')})`;
        params.push(...queueStatuses);
      }
    }

    // Filter by shipper assignment if shipper view
    if (shipperId) {
      query += ' AND s.shipper_id = ?';
      params.push(shipperId);
    } else if (currentUser.role === 'shipper' && !roleQueue) {
      // If current user is shipper and viewing their dashboard
      query += ' AND s.shipper_id = ?';
      params.push(currentUser.id);
    }

    // Filter by search keyword
    if (search) {
      query += ' AND (o.invoice_no LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    // Filter by tag
    if (tag) {
      query += ' AND o.tags LIKE ?';
      params.push(`%${tag}%`);
    }

    // Filter by payment status
    if (paymentStatus) {
      query += ' AND o.payment_status = ?';
      params.push(paymentStatus);
    }

    query += ' ORDER BY o.created_at DESC';

    const rawOrders = (await db.prepare(query).bind(...params).all<any>()).results || [];

    // Format orders and fetch basic items count
    const orders: Order[] = rawOrders.map((row) => {
      let parsedTags: string[] = [];
      try {
        parsedTags = JSON.parse(row.tags || '[]');
      } catch {
        parsedTags = [];
      }

      return {
        id: row.id,
        invoice_no: row.invoice_no,
        invoice_date: row.invoice_date,
        customer_name: row.customer_name,
        customer_phone: row.customer_phone,
        customer_address: row.customer_address,
        customer_email: row.customer_email,
        tags: parsedTags,
        note: row.note,
        sales_user_id: row.sales_user_id,
        status: row.status,
        payment_status: row.payment_status,
        related_order_id: row.related_order_id,
        total_amount: row.total_amount,
        paid_amount: row.paid_amount,
        created_at: row.created_at,
        updated_at: row.updated_at,
        sales_user: {
          id: row.sales_user_id,
          name: row.sales_user_name || 'Kinh doanh',
          email: row.sales_user_email || '',
          role: 'kinh_doanh',
          is_active: 1,
          created_at: '',
        },
        shipment: row.shipper_id
          ? {
              id: '',
              order_id: row.id,
              shipper_id: row.shipper_id,
              assigned_by_user_id: '',
              address: row.shipping_address,
              distance_km: row.shipping_distance_km,
              km_source: 'gg_map',
              created_at: '',
              shipper: {
                id: row.shipper_id,
                name: row.shipper_name || 'Shipper',
                email: '',
                role: 'shipper',
                is_active: 1,
                created_at: '',
              },
            }
          : null,
      };
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi tải danh sách đơn hàng' },
      { status: statusFromError(error) }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireUser();
    if (!can(currentUser.role, 'order:create')) {
      return NextResponse.json(
        { error: 'Chỉ nhân viên Kinh Doanh hoặc Admin mới có quyền tạo đơn hàng' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      customer_address,
      customer_email,
      tags = [],
      note,
      items = [],
      initial_payment,
      is_draft = false,
      related_order_id = null,
    } = body;

    if (!customer_name?.trim() || !customer_phone?.trim()) {
      return NextResponse.json(
        { error: 'Tên khách hàng và Số điện thoại là bắt buộc' },
        { status: 400 }
      );
    }

    if (!is_draft && (!items || items.length === 0)) {
      return NextResponse.json(
        { error: 'Đơn hàng cần có ít nhất một sản phẩm/linh kiện' },
        { status: 400 }
      );
    }

    const db = getDb();
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const dateStr = new Date().toISOString().split('T')[0];

    // Generate invoice no: HD-YYYYMMDD-XXX
    const countRow = await db
      .prepare("SELECT COUNT(*) as count FROM orders WHERE invoice_date = ?")
      .bind(dateStr)
      .first<{ count: number }>();
    const count = (countRow?.count || 0) + 1;
    const invoiceNo = `HD-${dateStr.replace(/-/g, '')}-${String(count).padStart(3, '0')}`;

    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += (item.unit_price || 0) * (item.quantity || 1);
    }

    // Determine initial status
    const initialStatus: OrderStatus = is_draft ? 'draft' : 'kho_pending';

    // Handle payment
    let paidAmount = 0;
    let paymentStatus: PaymentStatus = 'unpaid';

    if (initial_payment && initial_payment.amount > 0) {
      paidAmount = Number(initial_payment.amount);
      if (paidAmount >= totalAmount && totalAmount > 0) {
        paymentStatus = 'full';
      } else if (paidAmount > 0) {
        paymentStatus = 'partial';
      }
    }

    const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);

    // Insert order
    await db
      .prepare(
        `INSERT INTO orders (
          id, invoice_no, invoice_date, customer_name, customer_phone, customer_address,
          customer_email, tags, note, sales_user_id, status, 
          payment_status, related_order_id, total_amount, paid_amount, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
      .bind(
        orderId,
        invoiceNo,
        dateStr,
        customer_name.trim(),
        customer_phone.trim(),
        customer_address?.trim() || null,
        customer_email?.trim() || null,
        tagsJson,
        note?.trim() || null,
        currentUser.id,
        initialStatus,
        paymentStatus,
        related_order_id || null,
        totalAmount,
        paidAmount
      )
      .run();

    // Insert order items
    for (const item of items) {
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await db
        .prepare(
          `INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, serial_number, warranty_months)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          itemId,
          orderId,
          item.product_id,
          item.quantity || 1,
          item.unit_price || 0,
          item.serial_number || null,
          item.warranty_months ?? 36
        )
        .run();
    }

    // Insert payment if provided
    if (initial_payment && initial_payment.amount > 0) {
      const payId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await db
        .prepare(
          `INSERT INTO payments (id, order_id, method, amount, collected_by_user_id, paid_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        )
        .bind(
          payId,
          orderId,
          initial_payment.method || 'cash',
          paidAmount,
          currentUser.id
        )
        .run();
    }

    // Insert initial status history
    const historyId = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const historyNote = is_draft
      ? 'Kinh doanh tạo bản nháp đơn hàng'
      : `Kinh doanh tạo đơn hàng mới chuyển kho (${paymentStatus === 'full' ? 'Đã thanh toán đủ' : paymentStatus === 'partial' ? `Đã cọc ${paidAmount.toLocaleString()}đ` : 'Chưa thanh toán'})`;

    await db
      .prepare(
        `INSERT INTO order_status_history (id, order_id, status, changed_by_user_id, note)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(historyId, orderId, initialStatus, currentUser.id, historyNote)
      .run();

    return NextResponse.json({
      success: true,
      orderId,
      invoiceNo,
      status: initialStatus,
      paymentStatus,
      message: `Đơn hàng ${invoiceNo} đã được tạo thành công!`,
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi tạo đơn hàng mới' },
      { status: statusFromError(error) }
    );
  }
}
