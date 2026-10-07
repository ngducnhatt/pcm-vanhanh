import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { can, statusFromError } from '@/lib/permissions';
import { Product } from '@/lib/types';

const createProductSchema = z.object({
  sku: z.string().trim().min(1, 'Vui lòng nhập mã sản phẩm').max(50),
  name: z.string().trim().min(1, 'Vui lòng nhập tên sản phẩm').max(200),
  unit_price: z.number().int().min(0, 'Giá phải lớn hơn hoặc bằng 0'),
  stock_qty: z.number().int().min(0, 'Số lượng phải lớn hơn hoặc bằng 0').default(0),
  category: z.string().trim().max(100).optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    await requireUser();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 100, 1), 200);

    const db = getDb();
    let query = 'SELECT id, sku, name, unit_price, stock_qty, category, created_at FROM products';
    const params: any[] = [];

    if (search) {
      query += ' WHERE sku LIKE ? OR name LIKE ? OR category LIKE ?';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY name ASC LIMIT ?';
    params.push(limit);

    const result = await db.prepare(query).bind(...params).all<Product>();

    return NextResponse.json(
      { products: result.results || [] },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi tải danh sách sản phẩm' },
      { status: statusFromError(error) }
    );
  }
}

/** POST /api/products - Thêm sản phẩm mới (chỉ Kho và Admin) */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireUser();
    if (!can(currentUser.roles, 'product:manage')) {
      return NextResponse.json(
        { error: 'Chỉ nhân viên Kho hoặc Admin mới có quyền nhập sản phẩm' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { sku, name, unit_price, stock_qty, category } = parsed.data;
    const db = getDb();

    // Kiểm tra SKU đã tồn tại chưa
    const existing = await db
      .prepare('SELECT id FROM products WHERE sku = ?')
      .bind(sku)
      .first<{ id: string }>();

    if (existing) {
      return NextResponse.json(
        { error: 'Mã sản phẩm đã tồn tại' },
        { status: 409 }
      );
    }

    const productId = `prd_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`;

    await db
      .prepare(
        `INSERT INTO products (id, sku, name, unit_price, stock_qty, category, created_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      )
      .bind(productId, sku, name, unit_price, stock_qty, category || null)
      .run();

    const created = await db
      .prepare('SELECT id, sku, name, unit_price, stock_qty, category, created_at FROM products WHERE id = ?')
      .bind(productId)
      .first<Product>();

    return NextResponse.json(
      { success: true, product: created },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi tạo sản phẩm' },
      { status: statusFromError(error) }
    );
  }
}
