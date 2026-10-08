import { NextRequest, NextResponse } from 'next/server';
import { getDb, withTransaction } from '@/lib/db';
import { requireUser, writeAuditLog } from '@/lib/auth';
import { notifyOrderEvent } from '@/lib/notifications';
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
    const shipperIdParam = searchParams.get('shipper_id')?.trim() || '';
    const from = searchParams.get('from')?.trim() || '';
    const to = searchParams.get('to')?.trim() || '';
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    if ((from && !DATE_RE.test(from)) || (to && !DATE_RE.test(to))) {
      return NextResponse.json({ error: 'Khoảng ngày không hợp lệ (YYYY-MM-DD)' }, { status: 400 });
    }
    if (from && to && from > to) {
      return NextResponse.json({ error: 'Ngày bắt đầu phải trước ngày kết thúc' }, { status: 400 });
    }
    const page = Math.min(Math.max(Number(searchParams.get('page')) || 1, 1), 1000);
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 50, 1), 100);
    const offset = (page - 1) * limit;
    // scope=all: Trung tâm đơn hàng (mọi người xem toàn bộ công ty).
    // scope=queue (mặc định): hàng đợi Vận hành, lọc riêng theo từng vai trò.
    const scope = searchParams.get('scope')?.trim() || 'queue';
    if (scope !== 'all' && scope !== 'queue') {
      return NextResponse.json({ error: 'scope phải là all hoặc queue' }, { status: 400 });
    }

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
    } else if (scope === 'queue') {
      // Hàng đợi Vận hành: ép queue theo role thật của user, không tin role_queue client gửi
      const isPrivileged =
        currentUser.roles.includes('admin') || currentUser.roles.includes('kinh_doanh');
      const effectiveQueue: Role | null = isPrivileged ? roleQueue : currentUser.roles[0];
      const queueStatuses = effectiveQueue ? getRoleQueueStatuses(effectiveQueue) : null;
      if (queueStatuses && queueStatuses.length > 0) {
        query += ` AND o.status IN (${queueStatuses.map(() => '?').join(', ')})`;
        params.push(...queueStatuses);
      }
      // Kinh doanh ở hàng đợi của mình chỉ thấy đơn do chính mình tạo
      if (effectiveQueue === 'kinh_doanh' && !currentUser.roles.includes('admin')) {
        query += ' AND o.sales_user_id = ?';
        params.push(currentUser.id);
      }
    }

    // Shipper ở hàng đợi chỉ xem đơn của chính mình (Trung tâm scope=all vẫn xem hết)
    if (scope === 'queue' && currentUser.roles.includes('shipper') && !currentUser.roles.includes('admin')) {
      query += ' AND s.shipper_id = ?';
      params.push(currentUser.id);
    } else if (shipperIdParam) {
      query += ' AND s.shipper_id = ?';
      params.push(shipperIdParam);
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

    // Filter by created date range (sargable để dùng idx_orders_created)
    if (from) {
      query += ' AND o.created_at >= ?';
      params.push(`${from} 00:00:00`);
    }
    if (to) {
      query += ' AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)';
      params.push(`${to} 00:00:00`);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

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
          phone: null,
          email: row.sales_user_email || '',
          roles: ['kinh_doanh'],
          is_active: 1,
          created_at: '',
        } as any,
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
                phone: null,
                email: '',
                roles: ['shipper'],
                is_active: 1,
                created_at: '',
              },
            } as any
          : null,
      };
    });

    return NextResponse.json(
      { orders, page, limit },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    const msg = error?.code === 'ER_DUP_ENTRY' ? 'Dữ liệu trùng lặp' : 'Lỗi tải danh sách đơn hàng';
    return NextResponse.json({ error: msg }, { status: statusFromError(error) });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireUser();
    if (!can(currentUser.roles, 'order:create')) {
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

    // Validate items + lookup giá server (chống đơn 0đ / giá âm do client gửi)
    const cleanItems: { product_id: string; quantity: number; unit_price: number; warranty_months: number; serial_number: string | null }[] = [];
    if (!is_draft) {
      if (items.length > 100) {
        return NextResponse.json({ error: 'Tối đa 100 dòng hàng mỗi đơn' }, { status: 400 });
      }
      const productIds = [...new Set(items.map((i: any) => i.product_id).filter(Boolean))];
      if (productIds.length === 0) {
        return NextResponse.json({ error: 'Thiếu product_id' }, { status: 400 });
      }
      const prodRows = (
        await db
          .prepare(`SELECT id, unit_price FROM products WHERE id IN (${productIds.map(() => '?').join(', ')})`)
          .bind(...productIds)
          .all<any>()
      ).results || [];
      if (prodRows.length !== productIds.length) {
        return NextResponse.json({ error: 'Có sản phẩm không tồn tại' }, { status: 400 });
      }
      const priceById = new Map(prodRows.map((p: any) => [p.id, Number(p.unit_price)]));
      for (const item of items) {
        const qty = Number(item.quantity);
        if (!item.product_id || !Number.isInteger(qty) || qty <= 0 || qty > 10000) {
          return NextResponse.json({ error: 'Số lượng phải là số nguyên 1-10000' }, { status: 400 });
        }
        const serverPrice = priceById.get(item.product_id) ?? 0;
        if (serverPrice < 0) {
          return NextResponse.json({ error: 'Giá sản phẩm không hợp lệ' }, { status: 400 });
        }
        const warranty = item.warranty_months ?? 36;
        if (!Number.isInteger(Number(warranty)) || Number(warranty) < 0 || Number(warranty) > 120) {
          return NextResponse.json({ error: 'Bảo hành phải 0-120 tháng' }, { status: 400 });
        }
        cleanItems.push({
          product_id: item.product_id,
          quantity: qty,
          unit_price: serverPrice,
          warranty_months: Number(warranty),
          serial_number: null,
        });
      }
    }

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const dateStr = new Date().toISOString().split('T')[0];

    // Mã đơn: số tăng dần từ 1 (logic sinh ở dưới, có retry chống trùng khi 2 request song song)
    const ALLOWED_METHODS = ['qr', 'cash', 'transfer'];
    const payMethod = initial_payment?.method || 'cash';
    if (initial_payment && !ALLOWED_METHODS.includes(payMethod)) {
      return NextResponse.json({ error: 'Phương thức thanh toán không hợp lệ' }, { status: 400 });
    }

    // Calculate total amount từ GIÁ SERVER
    let totalAmount = 0;
    for (const item of cleanItems) {
      totalAmount += item.unit_price * item.quantity;
    }
    if (!is_draft && totalAmount <= 0) {
      return NextResponse.json({ error: 'Tổng tiền đơn phải lớn hơn 0' }, { status: 400 });
    }

    // Handle payment (chặn overpay vượt tổng tiền)
    let paidAmount = 0;
    let paymentStatus: PaymentStatus = 'unpaid';
    const initialStatus: OrderStatus = is_draft ? 'draft' : 'kho_pending';

    if (initial_payment && Number(initial_payment.amount) > 0) {
      paidAmount = Math.floor(Number(initial_payment.amount));
      if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
        return NextResponse.json({ error: 'Số tiền cọc không hợp lệ' }, { status: 400 });
      }
      if (paidAmount > totalAmount) {
        return NextResponse.json({ error: 'Số tiền cọc không được vượt tổng tiền đơn' }, { status: 400 });
      }
      if (paidAmount >= totalAmount && totalAmount > 0) {
        paymentStatus = 'full';
      } else if (paidAmount > 0) {
        paymentStatus = 'partial';
      }
    }

    const cleanTags = Array.isArray(tags) ? tags.map(String).slice(0, 10).map((t) => t.slice(0, 50)) : [];
    const tagsJson = JSON.stringify(cleanTags);

    const newId = (prefix: string) =>
      `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`;

    // Tạo đơn trong transaction + retry invoice_no khi trùng (chống race MAX+1).
    // Mã đơn là số tăng dần từ 1 (1, 2, 3, ...). Đơn cũ định dạng HD-ngày-XXX
    // khi CAST sang số ra 0 nên dãy mới vẫn bắt đầu từ 1 mà không đụng đơn cũ.
    let invoiceNo = '';
    try {
      const created = await withTransaction(async (query) => {
        let attemptInvoice = '';
        for (let attempt = 0; attempt < 5; attempt++) {
          const maxRows: any = await query('SELECT MAX(CAST(invoice_no AS UNSIGNED)) AS max_no FROM orders', []);
          const nextNo = Number(maxRows?.[0]?.max_no || 0) + 1 + attempt;
          attemptInvoice = String(nextNo);
          try {
            await query(
              `INSERT INTO orders (
                id, invoice_no, invoice_date, customer_name, customer_phone, customer_address,
                customer_email, tags, note, sales_user_id, status,
                payment_status, related_order_id, total_amount, paid_amount,
                created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
              [
                orderId, attemptInvoice, dateStr,
                String(customer_name).trim().slice(0, 200),
                String(customer_phone).trim().slice(0, 30),
                customer_address ? String(customer_address).trim().slice(0, 500) : null,
                customer_email ? String(customer_email).trim().slice(0, 200) : null,
                tagsJson, note ? String(note).trim().slice(0, 2000) : null,
                currentUser.id, initialStatus, paymentStatus,
                related_order_id || null, totalAmount, paidAmount,
              ]
            );
            break;
          } catch (e: any) {
            if (e?.code === 'ER_DUP_ENTRY' && attempt < 4) continue;
            throw e;
          }
        }
        for (const item of cleanItems) {
          await query(
            `INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, serial_number, warranty_months)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [newId('item'), orderId, item.product_id, item.quantity, item.unit_price, null, item.warranty_months]
          );
        }
        if (paidAmount > 0) {
          await query(
            `INSERT INTO payments (id, order_id, method, amount, collected_by_user_id, paid_at)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [newId('pay'), orderId, payMethod, paidAmount, currentUser.id]
          );
        }
        const historyNote = is_draft
          ? 'Kinh doanh tạo bản nháp đơn hàng'
          : `Kinh doanh tạo đơn hàng mới chuyển kho xuất (${paymentStatus === 'full' ? 'Đã thanh toán đủ' : paymentStatus === 'partial' ? `Đã cọc ${paidAmount.toLocaleString()}đ` : 'Chưa thanh toán'})`;
        await query(
          `INSERT INTO order_status_history (id, order_id, status, changed_by_user_id, note)
           VALUES (?, ?, ?, ?, ?)`,
          [newId('hist'), orderId, initialStatus, currentUser.id, historyNote]
        );
        return { invoiceNo: attemptInvoice };
      });
      invoiceNo = created.invoiceNo;
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ error: 'Trùng số hóa đơn, vui lòng thử lại' }, { status: 409 });
      }
      throw e;
    }

    await writeAuditLog({
      action: 'order_created',
      actor: currentUser,
      targetUserId: null,
      targetName: invoiceNo,
      detail: { order_id: orderId, total: totalAmount },
      ip: request.headers.get('x-forwarded-for'),
    });

    // Tag kho khi có đơn mới cần xuất (bỏ qua bản nháp)
    if (!is_draft) {
      await notifyOrderEvent({
        actor: currentUser,
        orderId,
        invoiceNo,
        salesUserId: currentUser.id,
        kind: 'order_created',
        title: `Đơn mới ${invoiceNo} cần xuất kho`,
        message: `${currentUser.name} vừa tạo đơn ${String(customer_name).slice(0, 80)} (${totalAmount.toLocaleString('vi-VN')}đ)`,
        newStatus: 'kho_pending',
      });
    }

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
