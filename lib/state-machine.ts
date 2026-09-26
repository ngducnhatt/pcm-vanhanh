import { OrderStatus, PaymentStatus, Role } from './types';

/**
 * Checks if tags array contains a technical requirement tag
 */
export function hasTechnicalTag(tags: string[]): boolean {
  return tags.some((t) => {
    const norm = t.toLowerCase().trim();
    return norm === 'kithuat' || norm === 'kỹ thuật' || norm === 'ky_thuat' || norm === 'technical';
  });
}

/**
 * Checks if tags array contains a warranty tag
 */
export function hasWarrantyTag(tags: string[]): boolean {
  return tags.some((t) => {
    const norm = t.toLowerCase().trim();
    return norm === 'baohanh' || norm === 'bảo hành' || norm === 'bao_hanh' || norm === 'warranty';
  });
}

/**
 * Determine the next state after warehouse export (kho_done)
 * Rules:
 * 1. If has tech tag -> kithuat_pending
 * 2. Else if has warranty tag -> baohanh_pending
 * 3. Else -> ship_pending
 */
export function getNextStatusAfterKhoDone(tags: string[]): OrderStatus {
  if (hasTechnicalTag(tags)) {
    return 'kithuat_pending';
  }
  if (hasWarrantyTag(tags)) {
    return 'baohanh_pending';
  }
  return 'ship_pending';
}

/**
 * Determine the next state after technical complete (kithuat_done)
 * Rules:
 * Order of priority: Technical first, Warranty second.
 * 1. If has warranty tag -> baohanh_pending
 * 2. Else -> ship_pending
 */
export function getNextStatusAfterKithuatDone(tags: string[]): OrderStatus {
  if (hasWarrantyTag(tags)) {
    return 'baohanh_pending';
  }
  return 'ship_pending';
}

/**
 * Determine the next state after warranty complete (baohanh_done)
 * Rules:
 * Always advances to ship_pending
 */
export function getNextStatusAfterBaohanhDone(): OrderStatus {
  return 'ship_pending';
}

/**
 * Statuses that are considered "kho_done trở đi" where modifying order items triggers rollback to kho_pending
 */
export const POST_KHO_STATUSES: OrderStatus[] = [
  'kho_done',
  'kithuat_pending',
  'kithuat_done',
  'baohanh_pending',
  'baohanh_done',
  'ship_pending',
  'ship_assigned',
  'ship_dangiao',
  'ship_done',
];

/**
 * Check if editing items requires a rollback to kho_pending
 */
export function requiresRollbackToKho(currentStatus: OrderStatus): boolean {
  return POST_KHO_STATUSES.includes(currentStatus);
}

/**
 * Check if an order can be edited by sales (any time before completed and not cancelled)
 */
export function canEditOrder(status: OrderStatus): boolean {
  return status !== 'completed' && status !== 'cancelled';
}

/**
 * Check if an order can be cancelled by sales (any time before completed and not cancelled)
 */
export function canCancelOrder(status: OrderStatus): boolean {
  return status !== 'completed' && status !== 'cancelled';
}

/**
 * Check if order should automatically transition to 'completed'
 * Condition: ship_done AND payment_status === 'full'
 */
export function shouldCompleteOrder(status: OrderStatus, paymentStatus: PaymentStatus): boolean {
  return status === 'ship_done' && paymentStatus === 'full';
}

/**
 * Check what actions a role is permitted to perform on an order
 */
export function canPerformAction(
  role: Role,
  action:
    | 'create_order'
    | 'edit_order'
    | 'cancel_order'
    | 'receive_kho'
    | 'export_kho'
    | 'complete_kithuat'
    | 'complete_baohanh'
    | 'assign_ship'
    | 'start_delivery'
    | 'complete_delivery'
    | 'collect_payment',
  currentStatus?: OrderStatus
): boolean {
  if (role === 'admin') return true;

  switch (action) {
    case 'create_order':
      return role === 'kinh_doanh';

    case 'edit_order':
    case 'cancel_order':
      return role === 'kinh_doanh' && (currentStatus ? canEditOrder(currentStatus) : true);

    case 'receive_kho':
      return role === 'kho' && (currentStatus === 'new' || currentStatus === 'draft');

    case 'export_kho':
      return role === 'kho' && currentStatus === 'kho_pending';

    case 'complete_kithuat':
      // quan_ly_ky_thuat chỉ giám sát, không duyệt, không chặn luồng
      // ky_thuat thực hiện thao tác hoàn thành
      return role === 'ky_thuat' && currentStatus === 'kithuat_pending';

    case 'complete_baohanh':
      return role === 'bao_hanh' && currentStatus === 'baohanh_pending';

    case 'assign_ship':
      return role === 'quan_ly_ship' && currentStatus === 'ship_pending';

    case 'start_delivery':
      return role === 'shipper' && currentStatus === 'ship_assigned';

    case 'complete_delivery':
      return role === 'shipper' && currentStatus === 'ship_dangiao';

    case 'collect_payment':
      return role === 'kinh_doanh' || role === 'shipper';

    default:
      return false;
  }
}

/**
 * Filter allowed queue status codes for each role dashboard
 */
export function getRoleQueueStatuses(role: Role): OrderStatus[] | null {
  switch (role) {
    case 'admin':
      return null; // see all
    case 'kinh_doanh':
      return null; // sales can view all orders they created or overview
    case 'kho':
      return ['new', 'kho_pending', 'kho_done'];
    case 'ky_thuat':
    case 'quan_ly_ky_thuat':
      return ['kithuat_pending', 'kithuat_done'];
    case 'bao_hanh':
      return ['baohanh_pending', 'baohanh_done'];
    case 'quan_ly_ship':
      return ['ship_pending', 'ship_assigned', 'ship_dangiao', 'ship_done'];
    case 'shipper':
      return ['ship_assigned', 'ship_dangiao', 'ship_done', 'completed'];
    default:
      return null;
  }
}
