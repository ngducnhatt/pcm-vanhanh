/**
 * Rate limit in-memory theo cửa sổ trượt (sliding window).
 *
 * Dùng cho các API công khai (tra cứu đơn theo mã hoá đơn + SĐT) để chặn
 * dò mã hoá đơn / dò SĐT. Đủ dùng cho hệ thống chạy 1 instance Node.
 *
 * LƯU Ý: nếu deploy nhiều instance, mỗi instance có bộ đếm riêng — khi đó
 * cần Redis/MariaDB để chia sẻ. Hiện tại dự án chạy 1 process (`next start`).
 */
export interface RateLimitOptions {
  /** Số request tối đa trong cửa sổ. */
  limit: number;
  /** Độ dài cửa sổ (ms). */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Epoch ms khi cửa sổ hiện tại hết hạn. */
  resetAt: number;
  retryAfterSeconds: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastSweepAt = 0;
const SWEEP_INTERVAL_MS = 60_000;

function sweep(now: number): void {
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Ghi nhận 1 request vào bucket và trả về trạng thái giới hạn.
 * `allowed = false` nghĩa là client vượt giới hạn.
 */
export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const { limit, windowMs } = options;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const bucket: Bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, bucket);
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt: bucket.resetAt,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  return {
    allowed: existing.count <= limit,
    limit,
    remaining,
    resetAt: existing.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

/** Xoá toàn bộ bộ đếm (chỉ dùng cho test). */
export function resetRateLimits(): void {
  buckets.clear();
  lastSweepAt = 0;
}
