import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requirePermission, writeAuditLog } from '@/lib/auth';
import { statusFromError } from '@/lib/permissions';

/** GET /api/admin/audit-logs - nhật ký thao tác đăng nhập & quản trị tài khoản */
export async function GET(request: NextRequest) {
  try {
    await requirePermission('audit:read');

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 500);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

    const db = getDb();
    const result = await db
      .prepare(
        `SELECT id, actor_user_id, actor_name, action, target_user_id, target_name, detail, ip, created_at
         FROM auth_audit_log
         ORDER BY created_at DESC, id DESC
         LIMIT ? OFFSET ?`
      )
      .bind(limit, offset)
      .all<any>();

    const total = await db.prepare('SELECT COUNT(*) AS total FROM auth_audit_log').first<any>();

    return NextResponse.json({
      logs: (result.results || []).map((row: any) => ({
        ...row,
        detail: row.detail ? safeParseJson(row.detail) : null,
      })),
      total: Number(total?.total ?? 0),
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi tải nhật ký' },
      { status: statusFromError(error) }
    );
  }
}

function safeParseJson(value: string): Record<string, unknown> | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/** DELETE /api/admin/audit-logs - xoá nhật ký cũ hơn N ngày */
export async function DELETE(request: NextRequest) {
  try {
    const actor = await requirePermission('audit:read');

    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(Number(searchParams.get('days')) || 90, 1), 3650);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const db = getDb();
    await db.prepare('DELETE FROM auth_audit_log WHERE created_at < ?').bind(cutoff).run();

    await writeAuditLog({
      action: 'user_updated',
      actor,
      detail: { purge_audit_logs_older_than_days: days, cutoff },
    });

    return NextResponse.json({ success: true, cutoff });
  } catch (error: any) {
    console.error('Error purging audit logs:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi xoá nhật ký' },
      { status: statusFromError(error) }
    );
  }
}
