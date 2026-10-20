import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { logServerError, toSafeError } from '@/lib/api-error';
import { Role } from '@/lib/types';
/**
 * Vai trò được phép xem danh sách người dùng.
 * Shipper / kỹ thuật / bảo hành / quản lý kỹ thuật không cần danh sách này.
 */
const LIST_ALLOWED_ROLES: Role[] = [
  'admin',
  'kinh_doanh',
  'kho',
  'quan_ly_ship',
];

/**
 * Vai trò được phép xem PII liên hệ (SĐT, email) của người khác.
 * Người dùng có PII của chính mình vẫn thấy trong /api/auth/me.
 */
const CONTACT_ALLOWED_ROLES: Role[] = ['admin', 'kinh_doanh', 'kho', 'quan_ly_ship'];

/** Chỉ Admin mới cần tên đăng nhập (dùng cho quản trị tài khoản). */
const USERNAME_ALLOWED_ROLES: Role[] = ['admin'];

interface UserListRow {
  id: string;
  name: string;
  username: string | null;
  phone: string | null;
  email: string | null;
  is_active: number;
  created_at: string;
  roles: string;
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireUser();
    const roles = currentUser.roles || [];

    // Không cấp quyền xem danh sách người dùng cho nhóm không liên quan.
    if (!roles.some((role) => LIST_ALLOWED_ROLES.includes(role))) {
      return NextResponse.json({ error: 'Không có quyền xem danh sách người dùng' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') as Role | null;
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 100, 1), 200);

    const canViewContact = roles.some((role) => CONTACT_ALLOWED_ROLES.includes(role));
    const canViewUsername = roles.some((role) => USERNAME_ALLOWED_ROLES.includes(role));

    const db = getDb();
    // Roles nằm ở bảng user_roles (sau migration 0006), không dùng cột users.role cũ.
    // Luôn LEFT JOIN để trả về `roles` cho client (trước đây thiếu khi không lọc role).
    let query = `SELECT DISTINCT u.id, u.name, u.username, u.phone, u.email, u.is_active, u.created_at,
                        COALESCE(GROUP_CONCAT(ur.role), '') as roles
                 FROM users u
                 LEFT JOIN user_roles ur ON u.id = ur.user_id`;
    const params: unknown[] = [];
    if (role) {
      query += ' INNER JOIN user_roles ur_filter ON u.id = ur_filter.user_id AND ur_filter.role = ?';
      params.push(role);
    }
    query += ' WHERE u.is_active = 1 GROUP BY u.id ORDER BY u.name ASC LIMIT ?';
    params.push(limit);

    const result = await db.prepare(query).bind(...params).all<UserListRow>();

    // Chỉ trả về trường cần thiết; PII bị loại bỏ nếu vai trò không đủ quyền.
    const users = (result.results || []).map((u) => ({
      id: u.id,
      name: u.name,
      username: canViewUsername ? u.username : null,
      phone: canViewContact ? u.phone : null,
      email: canViewContact ? u.email : null,
      is_active: u.is_active,
      created_at: u.created_at,
      roles: typeof u.roles === 'string' && u.roles ? u.roles.split(',') : [],
    }));

    return NextResponse.json(
      { users },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error: unknown) {
    logServerError('list-users', error);
    const safe = toSafeError(error, 'Lỗi tải danh sách người dùng');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
