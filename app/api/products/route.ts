import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { statusFromError } from '@/lib/permissions';
import { Product } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    await requireUser();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';

    const db = getDb();
    let query = 'SELECT id, sku, name, unit_price, stock_qty, category, created_at FROM products';
    const params: any[] = [];

    if (search) {
      query += ' WHERE sku LIKE ? OR name LIKE ? OR category LIKE ?';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY name ASC';

    const result = await db.prepare(query).bind(...params).all<Product>();

    return NextResponse.json({
      products: result.results || [],
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi tải danh sách sản phẩm' },
      { status: statusFromError(error) }
    );
  }
}
