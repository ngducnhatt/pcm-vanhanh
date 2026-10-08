import {
  Calculator,
  Container,
  Cpu,
  LayoutDashboard,
  PackagePlus,
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
  /** Route App Router tương ứng (MPA: mỗi mục là 1 URL riêng). */
  href: string;
}

export const PRIMARY_NAV: PrimaryNavItem[] = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard, roles: ['admin'], href: '/tong-quan' },
  { id: 'deals', label: 'Trung tâm đơn hàng', icon: ShoppingCart, roles: [], href: '/don-hang' },
  { id: 'pipeline', label: 'Kho & Linh kiện', icon: Cpu, roles: [], href: '/kho-linh-kien' },
  { id: 'team', label: 'Nhân viên & Vai trò', icon: Users, roles: ['admin'], href: '/nhan-su' },
  { id: 'reports', label: 'Báo cáo doanh thu', icon: ReceiptText, roles: ['admin'], href: '/bao-cao' },
  { id: 'settings', label: 'Cài đặt', icon: Settings, roles: [], href: '/cai-dat' },
];

/** Trang mở đầu: Admin vào Tổng quan, nhân viên vào hàng đợi của họ. */
export function defaultSectionFor(roles: Role | Role[] | undefined | null): string {
  if (!roles) return 'deals';
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes('admin') ? 'overview' : 'deals';
}

export function primaryNavFor(roles: Role | Role[] | undefined | null): PrimaryNavItem[] {
  if (!roles) return [];
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return PRIMARY_NAV.filter((item) => roleArray.includes('admin') || item.roles.length === 0 || item.roles.some((r) => roleArray.includes(r)));
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
  /** Route App Router tương ứng (MPA). */
  href: string;
}

export const OPERATION_NAV: OperationNavItem[] = [
  { id: 'sale-orders', label: 'Kinh doanh (Tạo/Sửa)', icon: ShoppingCart, queue: 'kinh_doanh', roles: ['kinh_doanh'], href: '/van-hanh/kinh-doanh' },
  { id: 'warehouse-orders', label: 'Kho (Xuất / Serial)', icon: Warehouse, queue: 'kho', roles: ['kho'], href: '/van-hanh/kho' },
  {
    id: 'technical-orders',
    label: 'Kỹ thuật (Lắp ráp / Test)',
    icon: Wrench,
    queue: 'ky_thuat',
    roles: ['ky_thuat', 'quan_ly_ky_thuat'],
    href: '/van-hanh/ky-thuat',
  },
  { id: 'warranty-orders', label: 'Bảo hành (Xử lý lỗi)', icon: ShieldCheck, queue: 'bao_hanh', roles: ['bao_hanh'], href: '/van-hanh/bao-hanh' },
  { id: 'shipping-orders', label: 'Vận chuyển & Phân ship', icon: Container, queue: 'quan_ly_ship', roles: ['quan_ly_ship'], href: '/van-hanh/van-chuyen' },
  { id: 'shipper-orders', label: 'Đơn giao của tôi', icon: Truck, queue: 'shipper', roles: ['shipper'], href: '/van-hanh/giao-hang' },
  {
    id: 'accounting-orders',
    label: 'Thanh toán & Thu tiền',
    icon: Calculator,
    queue: 'all',
    roles: ['kinh_doanh', 'shipper'],
    href: '/van-hanh/thanh-toan',
  },
];

const OPERATION_IDS = new Set<string>(OPERATION_NAV.map((item) => item.id));
const PRIMARY_IDS = new Set<string>(PRIMARY_NAV.map((item) => item.id));

export function isOperationSection(id: string): id is OperationSection {
  return OPERATION_IDS.has(id);
}

/** Mục vận hành này có thuộc vai trò không? Admin thấy tất cả. */
export function canAccessOperation(roles: Role | Role[] | undefined | null, id: string): boolean {
  if (!roles) return false;
  const roleArray = Array.isArray(roles) ? roles : [roles];
  if (roleArray.includes('admin')) return true;
  if (!isOperationSection(id)) return false;
  return OPERATION_NAV.find((item) => item.id === id)?.roles.some((r) => roleArray.includes(r)) ?? false;
}

export function operationNavFor(roles: Role | Role[] | undefined | null): OperationNavItem[] {
  if (!roles) return [];
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return OPERATION_NAV.filter((item) => roleArray.includes('admin') || item.roles.some((r) => roleArray.includes(r)));
}

/** Người dùng này có mở được mục này không? */
export function canAccessSection(roles: Role | Role[] | undefined | null, id: string): boolean {
  if (!roles) return false;
  const roleArray = Array.isArray(roles) ? roles : [roles];
  if (isOperationSection(id)) return canAccessOperation(roles, id);
  if (roleArray.includes('admin')) return true;
  if (!PRIMARY_IDS.has(id)) return false;
  return primaryNavFor(roles).some((item) => item.id === id);
}

/** Map section id -> href (MPA). Dùng cho redirect/guard. */
export function hrefForSection(id: string): string {
  const primary = PRIMARY_NAV.find((item) => item.id === id);
  if (primary) return primary.href;
  const op = OPERATION_NAV.find((item) => item.id === id);
  if (op) return op.href;
  return '/don-hang';
}

/** Map pathname -> section id (để highlight sidebar + tiêu đề header). */
export function sectionForPath(pathname: string | null | undefined): string {
  if (!pathname) return 'deals';
  const primary = PRIMARY_NAV.find((item) => item.href === pathname);
  if (primary) return primary.id;
  const op = OPERATION_NAV.find((item) => item.href === pathname);
  if (op) return op.id;
  // Link riêng từng đơn: /don-hang/HD-... thuộc Trung tâm đơn hàng
  if (pathname === '/don-hang' || pathname.startsWith('/don-hang/')) return 'deals';
  if (pathname === '/thong-bao') return 'notifications';
  if (pathname === '/tim-kiem') return 'search';
  if (pathname === '/khach-hang') return 'customers';
  if (pathname === '/du-bao') return 'forecasting';
  return 'deals';
}

/** Route mặc định sau login theo vai trò (MPA thay cho defaultSectionFor cũ). */
export function defaultHrefFor(roles: Role | Role[] | undefined | null): string {
  return hrefForSection(defaultSectionFor(roles));
}
