import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { statusFromError } from '@/lib/permissions';

/** POST /api/notifications/read — đánh dấu đã đọc ({ ids?: string[] } hoặc { all: true }) */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireUser();
    const body = await request.json().catch(() => ({}));
    const db = getDb();

    if (body.all) {
      await db
        .prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0')
        .bind(currentUser.id)
        .run();
    } else if (Array.isArray(body.ids) && body.ids.length > 0) {
      const ids = body.ids.filter((x: unknown) => typeof x === 'string').slice(0, 100);
      if (ids.length === 0) return NextResponse.json({ success: true });
      await db
        .prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ? AND id IN (${ids.map(() => '?').join(', ')})`)
        .bind(currentUser.id, ...ids)
        .run();
    } else {
      return NextResponse.json({ error: 'Thiếu ids hoặc all:true' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error marking notifications read:', error);
    return NextResponse.json({ error: 'Lỗi cập nhật thông báo' }, { status: statusFromError(error) });
  }
}
