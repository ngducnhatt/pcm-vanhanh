import { isIP } from 'node:net';

/**
 * Lấy IP thật của client — chỉ tin header của proxy TIN CẬY.
 *
 * Vì sao không tin mặc định: `x-forwarded-for` / `cf-connecting-ip` do client
 * tự gửi được nếu app bị lộ trực tiếp ra Internet. Dùng header đó để tính
 * rate-limit làm cho attacker đổi header là né được giới hạn.
 *
 * Vì sao vẫn dùng được: app PCM chạy sau Caddy (hoặc Cloudflare) và chỉ bind
 * `127.0.0.1`, nên header do proxy ghi là đáng tin — nhưng chỉ khi người quản
 * trị khai báo proxy qua `TRUSTED_PROXY_HEADERS`.
 */
const DEFAULT_TRUSTED_HEADERS: string[] = [];

/** Danh sách header proxy được tin cậy (đọc từ env, không nhận từ request). */
export function getTrustedProxyHeaders(): string[] {
  const raw = process.env.TRUSTED_PROXY_HEADERS;
  if (raw === undefined) return DEFAULT_TRUSTED_HEADERS;
  return raw
    .split(',')
    .map((header) => header.trim().toLowerCase())
    .filter(Boolean);
}

/** Chuẩn hóa chuỗi IP (bỏ dấu ngoặc IPv6, cắt port, kiểm tra hợp lệ). */
export function normalizeIp(value: string | null | undefined): string | null {
  if (!value) return null;
  let candidate = value.trim();
  if (!candidate) return null;
  // IPv6 trong ngoặc: [::1]:443
  if (candidate.startsWith('[')) {
    const closing = candidate.indexOf(']');
    if (closing === -1) return null;
    candidate = candidate.slice(1, closing);
  } else if (candidate.split(':').length === 2) {
    // IPv4 kèm port: 1.2.3.4:5678
    const [ip, port] = candidate.split(':');
    if (/^\d+$/.test(port)) candidate = ip;
  }
  return isIP(candidate) ? candidate : null;
}

/**
 * IP client theo header proxy tin cậy. Trả `null` khi không xác định được —
 * lúc đó caller phải dùng một bucket chung thay vì giả định IP.
 */
export function getClientIp(request: { headers: Headers }): string | null {
  for (const header of getTrustedProxyHeaders()) {
    const raw = request.headers.get(header);
    if (!raw) continue;
    const first = raw.split(',')[0];
    const ip = normalizeIp(first);
    if (ip) return ip;
  }
  return null;
}

/** Khoá rate-limit: IP thật nếu có, nếu không gom chung vào một bucket. */
export function getRateLimitKey(request: { headers: Headers }, scope: string): string {
  const ip = getClientIp(request);
  return ip ? `${scope}:${ip}` : `${scope}:unknown`;
}