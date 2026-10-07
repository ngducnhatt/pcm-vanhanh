import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { statusFromError } from '@/lib/permissions';

/** GET /api/notifications — thông báo của chính mình */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireUser();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);
    const unreadOnly = searchParams.get('unread') === '1';

    const db = getDb();
    const rows = (
      await db
        .prepare(
          `SELECT id, order_id, invoice_no, kind, title, message, is_read, created_at
           FROM notifications
           WHERE user_id = ?${unreadOnly ? ' AND is_read = 0' : ''}
           ORDER BY created_at DESC
           LIMIT ? OFFSET ?`
        )
        .bind(currentUser.id, limit, offset)
        .all<any>()
    ).results || [];

    const countRow = await db
      .prepare('SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = 0')
      .bind(currentUser.id)
      .first<{ total: number }>();

    return NextResponse.json(
      {
        items: rows.map((r: any) => ({ ...r, is_read: Number(r.is_read) })),
        unread: Number(countRow?.total || 0),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Lỗi tải thông báo' }, { status: statusFromError(error) });
  }
}
