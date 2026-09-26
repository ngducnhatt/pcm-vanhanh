import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { AuthUser, requireUser } from '@/lib/auth';
import { statusFromError } from '@/lib/permissions';
import { Role } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    await requireUser();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') as Role | null;

    const db = getDb();
    let query = `SELECT id, name, phone, email, role, is_active, created_at, username
                 FROM users WHERE is_active = 1`;
    const params: any[] = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    query += ' ORDER BY name ASC';

    const result = await db.prepare(query).bind(...params).all<AuthUser>();

    return NextResponse.json({
      users: result.results || [],
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi tải danh sách người dùng' },
      { status: statusFromError(error) }
    );
  }
}
