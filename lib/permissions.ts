import { Role } from './types';

/**
 * Central permission map.
 *
 * Order lifecycle permissions mirror the state machine in lib/state-machine.ts,
 * account management is admin-only by design.
 */
export type Permission =
  // Orders
  | 'order:create'
  | 'order:edit'
  | 'order:cancel'
  | 'order:receive_kho'
  | 'order:export_kho'
  | 'order:complete_kithuat'
  | 'order:complete_baohanh'
  | 'order:assign_ship'
  | 'order:start_delivery'
  | 'order:complete_delivery'
  | 'order:collect_payment'
  // Platform
  | 'product:manage'
  | 'report:read'
  | 'audit:read'
  | 'account:manage';

const ALL_PERMISSIONS: Permission[] = [
  'order:create',
  'order:edit',
  'order:cancel',
  'order:receive_kho',
  'order:export_kho',
  'order:complete_kithuat',
  'order:complete_baohanh',
  'order:assign_ship',
  'order:start_delivery',
  'order:complete_delivery',
  'order:collect_payment',
  'product:manage',
  'report:read',
  'audit:read',
  'account:manage',
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ALL_PERMISSIONS,
  kinh_doanh: ['order:create', 'order:edit', 'order:cancel', 'order:collect_payment', 'report:read'],
  kho: ['order:edit', 'order:receive_kho', 'order:export_kho', 'report:read'],
  ky_thuat: ['order:complete_kithuat', 'report:read'],
  // Giám sát / điều phối: chỉ xem, không duyệt, không chặn luồng
  quan_ly_ky_thuat: ['report:read'],
  bao_hanh: ['order:complete_baohanh', 'report:read'],
  quan_ly_ship: ['order:assign_ship', 'report:read'],
  shipper: ['order:start_delivery', 'order:complete_delivery', 'order:collect_payment', 'report:read'],
};

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return Array.isArray(permissions) && permissions.includes(permission);
}

export function canManageAccounts(role: Role | undefined | null): boolean {
  return can(role, 'account:manage');
}

/** HTTP status helpers so API routes can answer 401/403 correctly. */
export class AuthError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 401, code = 'unauthorized') {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.code = code;
  }
}

export function statusFromError(error: unknown): number {
  const status = (error as { status?: number })?.status;
  return typeof status === 'number' && status >= 400 && status < 600 ? status : 500;
}
