import { getDb } from './db';
import type { AuthUser } from './types';
import type { Role } from './types';

export type NotifyKind =
  | 'order_created'
  | 'order_edited'
  | 'order_rollback'
  | 'order_exported'
  | 'order_status'
  | 'order_payment'
  | 'order_shipment'
  | 'order_cancelled'
  | 'order_completed';

function nid(prefix = 'ntf'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`;
}

export interface NotifyInput {
  userIds: string[];
  orderId?: string | null;
  invoiceNo?: string | null;
  kind: NotifyKind;
  title: string;
  message?: string | null;
  excludeUserId?: string | null;
}

/** Ghi thông báo cho nhiều user (best-effort, không bao giờ throw). */
export async function notifyUsers(input: NotifyInput): Promise<void> {
  try {
    const targets = [...new Set(input.userIds.filter(Boolean))].filter(
      (id) => id !== input.excludeUserId
    );
    if (targets.length === 0) return;
    const db = getDb();
    for (const userId of targets) {
      await db
        .prepare(
          `INSERT INTO notifications (id, user_id, order_id, invoice_no, kind, title, message)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          nid(),
          userId,
          input.orderId || null,
          input.invoiceNo || null,
          input.kind,
          input.title.slice(0, 255),
          input.message ? input.message.slice(0, 2000) : null
        )
        .run();
    }
  } catch (error) {
    console.error('[notify] failed:', error);
  }
}

/** Lấy id các user đang hoạt động theo 1 vai trò. */
export async function activeUserIdsByRole(role: Role): Promise<string[]> {
  try {
    const db = getDb();
    const rows = (
      await db
        .prepare(
          `SELECT u.id FROM users u
           INNER JOIN user_roles ur ON u.id = ur.user_id AND ur.role = ?
           WHERE u.is_active = 1`
        )
        .bind(role)
        .all<{ id: string }>()
    ).results || [];
    return rows.map((r) => r.id);
  } catch (error) {
    console.error('[notify] role lookup failed:', error);
    return [];
  }
}

/** Nhóm vai trò phụ trách 1 trạng thái đơn (để tag khi đơn tới tay họ). */
const STATUS_ROLE_MAP: Record<string, Role[]> = {
  new: ['kho'],
  kho_pending: ['kho'],
  kithuat_pending: ['ky_thuat'],
  baohanh_pending: ['bao_hanh'],
  ship_pending: ['quan_ly_ship'],
};

export interface OrderEvent {
  actor: AuthUser;
  orderId: string;
  invoiceNo: string;
  /** người tạo đơn (được tag mọi thay đổi mình không tự làm) */
  salesUserId?: string | null;
  /** shipper được gán (nếu có) */
  shipperId?: string | null;
  kind: NotifyKind;
  title: string;
  message?: string | null;
  /** trạng thái mới (để tag nhóm phụ trách) */
  newStatus?: string | null;
  /** nhóm vai trò bổ sung cần tag */
  extraRoles?: Role[];
}

/**
 * Tag chuẩn theo đơn: người tạo đơn + nhóm phụ trách trạng thái mới
 * + shipper (nếu có) — luôn trừ người vừa thao tác.
 */
export async function notifyOrderEvent(event: OrderEvent): Promise<void> {
  const userIds = new Set<string>();
  if (event.salesUserId) userIds.add(event.salesUserId);
  if (event.shipperId) userIds.add(event.shipperId);

  const roles = new Set<Role>(event.extraRoles || []);
  if (event.newStatus && STATUS_ROLE_MAP[event.newStatus]) {
    for (const r of STATUS_ROLE_MAP[event.newStatus]) roles.add(r);
  }
  for (const role of roles) {
    for (const id of await activeUserIdsByRole(role)) userIds.add(id);
  }

  await notifyUsers({
    userIds: [...userIds],
    orderId: event.orderId,
    invoiceNo: event.invoiceNo,
    kind: event.kind,
    title: event.title,
    message: event.message,
    excludeUserId: event.actor.id,
  });
}
