import type { Tone } from './ui';

export type Role =
  | 'admin'
  | 'kinh_doanh'
  | 'kho'
  | 'ky_thuat'
  | 'quan_ly_ky_thuat'
  | 'bao_hanh'
  | 'quan_ly_ship'
  | 'shipper';

export type OrderStatus =
  | 'draft'
  | 'new'
  | 'kho_pending'
  | 'kho_done'
  | 'kithuat_pending'
  | 'kithuat_done'
  | 'baohanh_pending'
  | 'baohanh_done'
  | 'ship_pending'
  | 'ship_assigned'
  | 'ship_dangiao'
  | 'ship_done'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'partial' | 'full';

export type PaymentMethod = 'qr' | 'cash' | 'transfer';

export type KmSource = 'gg_map' | 'manual';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  roles: Role[];
  is_active: number;
  created_at: string;
  /** Login credentials (populated by lib/auth, never the password hash) */
  username?: string | null;
  last_login_at?: string | null;
  locked_until?: string | null;
  failed_login_count?: number;
}

/**
 * User enriched with the account-state fields required by the auth layer.
 * Declared here (not in lib/auth.ts) so client components can import the
 * type without pulling in server-only modules.
 */
export interface AuthUser extends User {
  username: string | null;
  last_login_at: string | null;
  locked_until: string | null;
  failed_login_count: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  unit_price: number;
  stock_qty: number;
  category?: string | null;
  created_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  warranty_months: number;
  serial_number?: string | null;
  created_at?: string;
  product?: Product;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  changed_by_user_id: string;
  note?: string | null;
  snapshot_serials?: string | null; // JSON string of snapshot items with serials
  created_at: string;
  changed_by_user?: User;
}

export interface Payment {
  id: string;
  order_id: string;
  method: PaymentMethod;
  amount: number;
  collected_by_user_id: string;
  paid_at: string;
  collected_by_user?: User;
}

export interface Shipment {
  id: string;
  order_id: string;
  shipper_id: string;
  assigned_by_user_id: string;
  address: string;
  distance_km: number;
  km_source: KmSource;
  created_at: string;
  shipper?: User;
  assigned_by_user?: User;
}

export interface Order {
  id: string;
  invoice_no: string;
  invoice_date: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string | null;
  customer_email?: string | null;
  tags: string[]; // parsed from JSON array
  note?: string | null;
  sales_user_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  related_order_id?: string | null;
  total_amount: number;
  paid_amount: number;
  created_at: string;
  updated_at: string;
  sales_user?: User;
  items?: OrderItem[];
  history?: OrderStatusHistory[];
  payments?: Payment[];
  shipment?: Shipment | null;
  related_order?: Order | null;
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin Toàn Quyền',
  kinh_doanh: 'Kinh Doanh (Sales)',
  kho: 'Kho (Warehouse)',
  ky_thuat: 'Kỹ Thuật (Technical)',
  quan_ly_ky_thuat: 'Quản Lý Kỹ Thuật',
  bao_hanh: 'Bảo Hành (Warranty)',
  quan_ly_ship: 'Quản Lý Ship',
  shipper: 'Shipper Giao Hàng',
};

/**
 * Màu sắc trạng thái đơn hàng — quy ước cả hệ thống:
 *   đỏ   = chưa hoàn thành (hủy, lỗi)
 *   vàng = đang hoàn thành (chờ xử lý, đang chạy)
 *   xanh = đã hoàn thành
 *   đen/trắng = nháp, chưa vào quy trình
 */
export const STATUS_LABELS: Record<OrderStatus, { label: string; badge: string; tone: Tone }> = {
  draft: { label: 'Bản nháp', badge: 'Nháp', tone: 'neutral' },
  new: { label: 'Đơn mới', badge: 'Mới tạo', tone: 'warning' },
  kho_pending: { label: 'Chờ xuất kho', badge: 'Chờ kho', tone: 'warning' },
  kho_done: { label: 'Đã xuất kho', badge: 'Đã xuất', tone: 'success' },
  kithuat_pending: { label: 'Chờ kỹ thuật', badge: 'Chờ KT', tone: 'warning' },
  kithuat_done: { label: 'Kỹ thuật hoàn thành', badge: 'KT Xong', tone: 'success' },
  baohanh_pending: { label: 'Chờ bảo hành', badge: 'Chờ BH', tone: 'warning' },
  baohanh_done: { label: 'Bảo hành hoàn thành', badge: 'BH Xong', tone: 'success' },
  ship_pending: { label: 'Chờ phân công ship', badge: 'Chờ ship', tone: 'warning' },
  ship_assigned: { label: 'Đã phân công shipper', badge: 'Đã gán', tone: 'warning' },
  ship_dangiao: { label: 'Đang giao hàng', badge: 'Đang giao', tone: 'warning' },
  ship_done: { label: 'Đã giao xong', badge: 'Đã giao', tone: 'success' },
  completed: { label: 'Hoàn tất', badge: 'Hoàn tất', tone: 'success' },
  cancelled: { label: 'Đã hủy', badge: 'Đã hủy', tone: 'danger' },
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, { label: string; tone: Tone }> = {
  unpaid: { label: 'Chưa thanh toán', tone: 'danger' },
  partial: { label: 'Thanh toán một phần', tone: 'warning' },
  full: { label: 'Đã thanh toán đủ', tone: 'success' },
};
