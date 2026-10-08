import { getDb } from '@/lib/db';
import type { Order, OrderItem, OrderStatusHistory, Payment, Shipment } from '@/lib/types';

/**
 * Lấy toàn bộ chi tiết 1 đơn hàng theo id (order + items + history + payments + shipment).
 * Dùng chung cho GET /api/orders/[id] (nội bộ) và /api/orders/track (link khách hàng).
 * Trả null khi không tìm thấy.
 */
export async function fetchOrderDetail(id: string): Promise<Order | null> {
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

  if (!orderRow) return null;

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
      phone: null,
      email: '',
      roles: ['admin'],
      is_active: 1,
      created_at: '',
    },
  })) as any;

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
      phone: null,
      email: '',
      roles: ['kinh_doanh'],
      is_active: 1,
      created_at: '',
    },
  })) as any;

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
          roles: ['shipper'],
          is_active: 1,
          created_at: '',
        },
        assigned_by_user: {
          id: shipmentRow.assigned_by_user_id,
          name: shipmentRow.assigned_user_name || 'Quản lý ship',
          phone: null,
          email: '',
          roles: ['quan_ly_ship'],
          is_active: 1,
          created_at: '',
        },
      } as any
    : null;

  let parsedTags: string[] = [];
  try {
    parsedTags = JSON.parse(orderRow.tags || '[]');
  } catch {
    parsedTags = [];
  }

  return {
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
      phone: null,
      email: orderRow.sales_user_email || '',
      roles: ['kinh_doanh'],
      is_active: 1,
      created_at: '',
    } as any,
    items,
    history,
    payments,
    shipment,
  };
}

/** Chuẩn hóa SĐT để so sánh: bỏ ký tự lạ, đổi đầu 84/+84 về 0. */
export function normalizePhone(phone: string | null | undefined): string {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length >= 11) digits = '0' + digits.slice(2);
  if (digits.startsWith('0084') && digits.length >= 12) digits = '0' + digits.slice(4);
  return digits;
}

/** SĐT khách nhập có khớp SĐT trên đơn không? */
export function phonesMatch(input: string | null | undefined, onOrder: string | null | undefined): boolean {
  const a = normalizePhone(input);
  const b = normalizePhone(onOrder);
  return a.length >= 9 && a === b;
}

export interface PublicOrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  warranty_months: number;
}

export interface PublicOrder {
  invoice_no: string;
  invoice_date: string;
  customer_name: string;
  status: string;
  payment_status: string;
  total_amount: number;
  paid_amount: number;
  items: PublicOrderItem[];
  payments: Array<{ method: string; amount: number; paid_at: string }>;
  shipment: { address: string; distance_km: number | null; shipper_name: string | null } | null;
  history: Array<{ status: string; created_at: string }>;
}

/**
 * Lược đồ công khai cho khách hàng: hóa đơn + trạng thái + thanh toán + vận chuyển.
 * Cố tình ẩn: serials, ghi chú nội bộ, tên nhân viên, SĐT shipper, snapshot kho.
 */
export function toPublicOrder(order: Order): PublicOrder {
  return {
    invoice_no: order.invoice_no,
    invoice_date: order.invoice_date,
    customer_name: order.customer_name,
    status: order.status,
    payment_status: order.payment_status,
    total_amount: Number(order.total_amount),
    paid_amount: Number(order.paid_amount),
    items: (order.items || []).map((it) => ({
      product_name: (it as any).product?.name || 'Linh kiện',
      quantity: it.quantity,
      unit_price: Number(it.unit_price),
      warranty_months: it.warranty_months ?? 36,
    })),
    payments: (order.payments || []).map((p: any) => ({
      method: p.method,
      amount: Number(p.amount),
      paid_at: p.paid_at,
    })),
    shipment: order.shipment
      ? {
          address: order.shipment.address,
          distance_km: order.shipment.distance_km,
          shipper_name: (order.shipment as any).shipper?.name || null,
        }
      : null,
    history: (order.history || []).map((h) => ({ status: h.status, created_at: h.created_at })),
  };
}
