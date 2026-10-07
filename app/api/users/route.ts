import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { can, statusFromError } from '@/lib/permissions';
import { Role } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireUser();
    // Shipper / BH / KT không được liệt kê toàn bộ users (PII)
    if (
      !can(currentUser.roles, 'account:manage') &&
      !currentUser.roles.includes('quan_ly_ship') &&
      !currentUser.roles.includes('kinh_doanh') &&
      !currentUser.roles.includes('kho') &&
      !currentUser.roles.includes('admin')
    ) {
      return NextResponse.json({ error: 'Không có quyền xem danh sách người dùng' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') as Role | null;
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 100, 1), 200);

    const db = getDb();
    // Roles nằm ở bảng user_roles (sau migration 0006), không dùng cột users.role cũ
    let query = `SELECT DISTINCT u.id, u.name, u.phone, u.email, u.is_active, u.created_at, u.username
                 FROM users u`;
    const params: any[] = [];
    if (role) {
      query += ' INNER JOIN user_roles ur ON u.id = ur.user_id AND ur.role = ?';
      params.push(role);
    }
    query += ' WHERE u.is_active = 1 ORDER BY u.name ASC LIMIT ?';
    params.push(limit);

    const result = await db.prepare(query).bind(...params).all<any>();

    return NextResponse.json({
      users: result.results || [],
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Lỗi tải danh sách người dùng' },
      { status: statusFromError(error) }
    );
  }
}
