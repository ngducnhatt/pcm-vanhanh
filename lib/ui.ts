import {
  Bike,
  Eye,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Warehouse,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from './types';

/**
 * Design system dùng chung cho toàn bộ giao diện.
 *
 * Nguyên tắc thiết kế:
 * 1. ÍT VIỀN. Khung chỉ dùng ở nơi cần để nhận diện tương tác (ô nhập,
 *    nút, vùng focus). Mọi khối khác phân biệt bằng NỀN và KHOẢNG CÁCH.
 * 2. CHỈ 3 MÀU TRẠNG THÁI, trên nền trắng/đen:
 *      đỏ  = chưa hoàn thành (lỗi, bị hủy, bị chặn)
 *      vàng = đang hoàn thành (đang chờ, đang xử lý)
 *      xanh = đã hoàn thành (xong, thành công)
 *    Mọi thứ còn lại dùng `neutral` (đen/trắng) hoặc `accent` (đảo màu
 *    trắng-đen cho nút chính và trạng thái đang chọn).
 * 3. MÀU = TRẠNG THÁI, không phải DANH TÍNH. Vai trò nhân viên không dùng
 *    màu riêng để bảng không bị "đốm màu".
 */

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';

/** Nền + chữ cho một tone (dùng cho pill, badge, chip) — KHÔNG viền */
export const TONE_CHIP: Record<Tone, string> = {
  neutral: 'bg-secondary text-muted-foreground',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
  accent: 'bg-accent text-accent-foreground',
};

/** Ô vuông icon nền tone (dùng cho icon trong bảng, thẻ thống kê) */
export const TONE_SURFACE: Record<Tone, string> = {
  neutral: 'bg-secondary text-muted-foreground',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
  accent: 'bg-accent/15 text-accent',
};

/** Chữ tone trên nền thường (không nền, không viền) */
export const TONE_TEXT: Record<Tone, string> = {
  neutral: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  accent: 'text-accent',
};

/** Nền tone rất nhạt, dùng cho hàng highlight hoặc vùng chú ý */
export const TONE_WASH: Record<Tone, string> = {
  neutral: 'bg-secondary/40',
  success: 'bg-success/8',
  warning: 'bg-warning/8',
  danger: 'bg-danger/8',
  accent: 'bg-accent/8',
};

/** Kích thước chuẩn cho pill — mọi badge trong app dùng đúng chuỗi này */
export const CHIP_BASE = 'inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium leading-none';

/** Chuẩn hoá một chip có tone */
export function chip(tone: Tone): string {
  return `${CHIP_BASE} ${TONE_CHIP[tone]}`;
}

// ---------------------------------------------------------------------------
// Vai trò
// ---------------------------------------------------------------------------

export interface RoleMeta {
  label: string;
  /** Nhãn ngắn cho chip hẹp */
  short: string;
  icon: LucideIcon;
}

export const ROLE_META: Record<Role, RoleMeta> = {
  admin: { label: 'Admin Toàn Quyền', short: 'Admin', icon: ShieldAlert },
  kinh_doanh: { label: 'Kinh Doanh', short: 'Kinh doanh', icon: ShoppingCart },
  kho: { label: 'Kho', short: 'Kho', icon: Warehouse },
  ky_thuat: { label: 'Kỹ Thuật', short: 'Kỹ thuật', icon: Wrench },
  quan_ly_ky_thuat: { label: 'Quản Lý Kỹ Thuật', short: 'QL Kỹ thuật', icon: Eye },
  bao_hanh: { label: 'Bảo Hành', short: 'Bảo hành', icon: ShieldCheck },
  quan_ly_ship: { label: 'Quản Lý Ship', short: 'QL Ship', icon: Truck },
  shipper: { label: 'Shipper Giao Hàng', short: 'Shipper', icon: Bike },
};

export function roleLabel(role: Role, short = false): string {
  const meta = ROLE_META[role];
  return short ? meta.short : meta.label;
}

// ---------------------------------------------------------------------------
// Chuẩn layout dùng chung
// ---------------------------------------------------------------------------

/** Thẻ / panel chuẩn — phân biệt bằng nền, KHÔNG dùng viền */
export const SURFACE_CARD = 'rounded-xl bg-card';

/** Ô nhập chuẩn — viền chỉ hiện khi focus */
export const FIELD_BASE =
  'h-9 w-full rounded-lg border border-transparent bg-secondary/60 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-accent/60 focus:bg-secondary';

/** Nhãn form chuẩn */
export const LABEL_BASE = 'text-xs font-medium text-muted-foreground';

/** Tiêu đề khối chuẩn */
export const SECTION_TITLE = 'text-lg font-semibold text-foreground';
export const SECTION_SUBTITLE = 'mt-0.5 text-xs text-muted-foreground';

/** Hàng bảng: chỉ đường kẻ ngang mảnh, không viền dọc */
export const TABLE_DIVIDER = 'divide-y divide-border/50';
