import { statusFromError } from './permissions';

/**
 * Chuẩn hoá lỗi trả về cho client.
 *
 * Quy tắc:
 * - Lỗi 4xx có thủ công (AuthError, lỗi validate) → trả message gốc, hữu ích
 *   cho người dùng.
 * - Lỗi 5xx / lỗi hệ thống (SQL, mạng, bug) → KHÔNG trả message gốc vì có
 *   thể lộ cấu trúc DB, tên bảng, tên cột hoặc đường dẫn file nội bộ.
 */
export interface SafeError {
  message: string;
  status: number;
}

export function toSafeError(error: unknown, fallbackMessage: string): SafeError {
  const status = statusFromError(error);
  if (status >= 400 && status < 500) {
    const message = (error as { message?: unknown } | null)?.message;
    if (typeof message === 'string' && message.trim()) {
      return { message, status };
    }
  }
  return { message: fallbackMessage, status: status >= 500 ? status : 500 };
}

/** Log lỗi hệ thống ở server (KHÔNG log mật khẩu/token). */
export function logServerError(scope: string, error: unknown): void {
  console.error(`[${scope}]`, error);
}
