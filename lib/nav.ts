import {
  Calculator,
  Container,
  Cpu,
  LayoutDashboard,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from './types';

/**
 * Điều hướng của PCM Vận Hành.
 *
 * Quy tắc: Admin thấy TẤT CẢ. Nhân viên chỉ thấy phần tối thiểu cần cho
 * công việc hằng ngày — hàng đợi đơn của họ, danh sách linh kiện, và cài đặt
 * tài khoản cá nhân.
 */

/** Các mục dùng chung cho mọi vai trò. */
export const SHARED_SECTIONS = ['deals', 'pipeline', 'settings'] as const;

export interface PrimaryNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Vai trò được thấy mục này. Rỗng = mọi vai trò. */
  roles: Role[];
}

export const PRIMARY_NAV: PrimaryNavItem[] = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard, roles: ['admin'] },
  { id: 'deals', label: 'Trung tâm đơn hàng', icon: ShoppingCart, roles: [] },
  { id: 'pipeline', label: 'Kho & Linh kiện', icon: Cpu, roles: [] },
  { id: 'team', label: 'Nhân viên & Vai trò', icon: Users, roles: ['admin'] },
  { id: 'reports', label: 'Báo cáo doanh thu', icon: ReceiptText, roles: ['admin'] },
  { id: 'settings', label: 'Cài đặt', icon: Settings, roles: [] },
];

/** Trang mở đầu: Admin vào Tổng quan, nhân viên vào hàng đợi của họ. */
export function defaultSectionFor(role: Role | undefined | null): string {
  return role === 'admin' ? 'overview' : 'deals';
}

export function primaryNavFor(role: Role | undefined | null): PrimaryNavItem[] {
  if (!role) return [];
  return PRIMARY_NAV.filter((item) => role === 'admin' || item.roles.length === 0 || item.roles.includes(role));
}

// ---------------------------------------------------------------------------
// Nhóm menu "Vận hành" — chỉ dành cho Admin
// ---------------------------------------------------------------------------

/**
 * Mỗi vai trò thấy đúng mục vận hành của mình, khớp với `canPerformAction()`
 * trong lib/state-machine.ts:
 *   kinh_doanh       -> tạo/sửa/hủy đơn + thu tiền
 *   kho              -> xuất kho, gán serial
 *   ky_thuat         -> lắp ráp, hoàn thành kỹ thuật
 *   quan_ly_ky_thuat -> xem tiến độ kỹ thuật (giám sát, KHÔNG duyệt)
 *   bao_hanh         -> xử lý bảo hành
 *   quan_ly_ship     -> phân công shipper
 *   shipper          -> đơn giao của mình + thu tiền COD
 *   admin            -> toàn quyền, thấy tất cả các mục
 */
export type OperationSection =
  | 'sale-orders'
  | 'warehouse-orders'
  | 'technical-orders'
  | 'warranty-orders'
  | 'shipping-orders'
  | 'shipper-orders'
  | 'accounting-orders';

export interface OperationNavItem {
  id: OperationSection;
  label: string;
  icon: LucideIcon;
  /** Hàng đợi mà OrdersHub sẽ lọc. */
  queue: string;
  /** Vai trò được thấy mục này. Admin luôn thấy tất cả. */
  roles: Role[];
}

export const OPERATION_NAV: OperationNavItem[] = [
  { id: 'sale-orders', label: 'Kinh doanh (Tạo/Sửa)', icon: ShoppingCart, queue: 'kinh_doanh', roles: ['kinh_doanh'] },
  { id: 'warehouse-orders', label: 'Kho (Xuất / Serial)', icon: Warehouse, queue: 'kho', roles: ['kho'] },
  {
    id: 'technical-orders',
    label: 'Kỹ thuật (Lắp ráp / Test)',
    icon: Wrench,
    queue: 'ky_thuat',
    roles: ['ky_thuat', 'quan_ly_ky_thuat'],
  },
  { id: 'warranty-orders', label: 'Bảo hành (Xử lý lỗi)', icon: ShieldCheck, queue: 'bao_hanh', roles: ['bao_hanh'] },
  { id: 'shipping-orders', label: 'Vận chuyển & Phân ship', icon: Container, queue: 'quan_ly_ship', roles: ['quan_ly_ship'] },
  { id: 'shipper-orders', label: 'Đơn giao của tôi', icon: Truck, queue: 'shipper', roles: ['shipper'] },
  {
    id: 'accounting-orders',
    label: 'Thanh toán & Thu tiền',
    icon: Calculator,
    queue: 'all',
    roles: ['kinh_doanh', 'shipper'],
  },
];

const OPERATION_IDS = new Set<string>(OPERATION_NAV.map((item) => item.id));
const PRIMARY_IDS = new Set<string>(PRIMARY_NAV.map((item) => item.id));

export function isOperationSection(id: string): id is OperationSection {
  return OPERATION_IDS.has(id);
}

/** Mục vận hành này có thuộc vai trò không? Admin thấy tất cả. */
export function canAccessOperation(role: Role | undefined | null, id: string): boolean {
  if (!role) return false;
  if (role === 'admin') return true;
  if (!isOperationSection(id)) return false;
  return OPERATION_NAV.find((item) => item.id === id)?.roles.includes(role) ?? false;
}

export function operationNavFor(role: Role | undefined | null): OperationNavItem[] {
  if (!role) return [];
  return OPERATION_NAV.filter((item) => role === 'admin' || item.roles.includes(role));
}

/** Người dùng này có mở được mục này không? */
export function canAccessSection(role: Role | undefined | null, id: string): boolean {
  if (!role) return false;
  if (isOperationSection(id)) return canAccessOperation(role, id);
  if (role === 'admin') return true;
  if (!PRIMARY_IDS.has(id)) return false;
  return primaryNavFor(role).some((item) => item.id === id);
}
