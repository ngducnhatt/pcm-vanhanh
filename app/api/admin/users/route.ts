import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { generateToken, hashPassword } from '@/lib/crypto';
import { checkPasswordPolicy, requirePermission, writeAuditLog } from '@/lib/auth';
import { statusFromError } from '@/lib/permissions';
import { Role, ROLE_LABELS } from '@/lib/types';

export const ROLES = Object.keys(ROLE_LABELS) as Role[];

const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Tên đăng nhập tối thiểu 3 ký tự')
  .max(32, 'Tên đăng nhập tối đa 32 ký tự')
  .regex(/^[a-z0-9._-]+$/, 'Tên đăng nhập chỉ gồm chữ thường không dấu, số và các ký tự . _ -')
  .transform((value) => value.toLowerCase());

const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Họ tên tối thiểu 2 ký tự').max(120),
  username: usernameSchema,
  email: z.string().trim().email('Email không hợp lệ').max(160),
  phone: z.string().trim().max(30).optional().nullable(),
  role: z.enum(ROLES as [Role, ...Role[]]),
  password: z
    .string()
    .max(128)
    .optional()
    .nullable(),
  is_active: z.boolean().optional().default(true),
});

/** GET /api/admin/users - danh sách tài khoản (kể cả đã vô hiệu hoạt) */
export async function GET() {
  try {
    await requirePermission('account:manage');

    const db = getDb();
    const result = await db
      .prepare(
        `SELECT id, name, phone, email, role, is_active, created_at, username,
                last_login_at, locked_until, failed_login_count
         FROM users
         ORDER BY is_active DESC, role, name`
      )
      .all<any>();

    return NextResponse.json({ users: result.results || [] });
  } catch (error: any) {
    console.error('Error listing users:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi tải danh sách tài khoản' },
      { status: statusFromError(error) }
    );
  }
}

/** POST /api/admin/users - tạo tài khoản mới */
export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission('account:manage');

    const raw = await request.json().catch(() => ({}));
    const parsed = createUserSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, username, email, phone, role, is_active } = parsed.data;
    const adminProvidedPassword = parsed.data.password || null;

    // No password supplied -> admin gets a generated one to hand over
    const password = adminProvidedPassword || generateToken(9);

    const policy = checkPasswordPolicy(password);
    if (!policy.valid) {
      return NextResponse.json({ error: policy.errors[0], errors: policy.errors }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const db = getDb();

    const duplicate = await db
      .prepare('SELECT id, name FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE')
      .bind(username, email)
      .first<any>();

    if (duplicate) {
      return NextResponse.json(
        { error: 'Tên đăng nhập hoặc email đã tồn tại trong hệ thống' },
        { status: 409 }
      );
    }

    const userId = `usr_${username}_${Date.now().toString(36)}`;

    await db
      .prepare(
        `INSERT INTO users (id, name, phone, email, role, is_active, username, password_hash, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      )
      .bind(
        userId,
        name,
        phone || null,
        email,
        role,
        is_active ? 1 : 0,
        username,
        passwordHash
      )
      .run();

    const created = await db
      .prepare(
        `SELECT id, name, phone, email, role, is_active, created_at, username, last_login_at
         FROM users WHERE id = ?`
      )
      .bind(userId)
      .first<any>();

    const ip = request.headers.get('cf-connecting-ip') || null;
    await writeAuditLog({
      action: 'user_created',
      actor,
      targetUserId: userId,
      targetName: name,
      detail: {
        username,
        role,
        is_active,
        generated_password: !adminProvidedPassword,
      },
      ip,
    });

    return NextResponse.json(
      {
        success: true,
        user: created,
        // Only returned once, so the admin can pass it on to the new account
        temporaryPassword: adminProvidedPassword ? null : password,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi tạo tài khoản' },
      { status: statusFromError(error) }
    );
  }
}
