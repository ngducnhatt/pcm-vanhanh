import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { statusFromError } from '@/lib/permissions';

/**
 * GET /api/admin/activity — nhật ký hoạt động vận hành (CHỈ admin).
 * Nguồn: order_status_history + actor (users/user_roles) + invoice_no.
 */
export async function GET(request: NextRequest) {
  try {
    await requirePermission('audit:read');

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role')?.trim() || '';
    const from = searchParams.get('from')?.trim() || '';
    const to = searchParams.get('to')?.trim() || '';
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 50, 1), 200);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    if ((from && !DATE_RE.test(from)) || (to && !DATE_RE.test(to))) {
      return NextResponse.json({ error: 'Khoảng ngày không hợp lệ (YYYY-MM-DD)' }, { status: 400 });
    }

    const db = getDb();
    const filterRole = role ? 'AND EXISTS (SELECT 1 FROM user_roles ur2 WHERE ur2.user_id = u.id AND ur2.role = ?)' : '';
    const filterFrom = from ? 'AND h.created_at >= ?' : '';
    const filterTo = to ? 'AND h.created_at < DATE_ADD(?, INTERVAL 1 DAY)' : '';
    const params: unknown[] = [
      ...(role ? [role] : []),
      ...(from ? [`${from} 00:00:00`] : []),
      ...(to ? [`${to} 00:00:00`] : []),
    ];

    const rows = (
      await db
        .prepare(
          `SELECT h.id, h.order_id, h.status, h.note, h.created_at,
                  o.invoice_no,
                  u.id AS actor_id, u.name AS actor_name, u.username AS actor_username,
                  COALESCE(GROUP_CONCAT(DISTINCT ur.role), '') AS actor_roles
           FROM order_status_history h
           LEFT JOIN orders o ON o.id = h.order_id
           LEFT JOIN users u ON u.id = h.changed_by_user_id
           LEFT JOIN user_roles ur ON ur.user_id = u.id
           WHERE 1=1 ${filterRole} ${filterFrom} ${filterTo}
           GROUP BY h.id
           ORDER BY h.created_at DESC
           LIMIT ? OFFSET ?`
        )
        .bind(...params, limit, offset)
        .all<any>()
    ).results || [];

    const totalRow = await db
      .prepare(
        `SELECT COUNT(DISTINCT h.id) AS total
         FROM order_status_history h
         LEFT JOIN users u ON u.id = h.changed_by_user_id
         WHERE 1=1 ${filterRole} ${filterFrom} ${filterTo}`
      )
      .bind(...params)
      .first<{ total: number }>();

    const items = rows.map((r: any) => ({
      id: r.id,
      order_id: r.order_id,
      invoice_no: r.invoice_no,
      status: r.status,
      note: r.note,
      created_at: r.created_at,
      actor: r.actor_id
        ? {
            id: r.actor_id,
            name: r.actor_name,
            username: r.actor_username,
            roles: typeof r.actor_roles === 'string' && r.actor_roles ? r.actor_roles.split(',') : [],
          }
        : null,
    }));

    return NextResponse.json(
      { items, total: Number(totalRow?.total || 0), limit, offset },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: 'Lỗi tải hoạt động' }, { status: statusFromError(error) });
  }
}
