/**
 * Mã hoá đơn chuẩn của hệ thống: HD-001, HD-002, ...
 *
 * - Số thứ tự bắt đầu từ 1.
 * - Luôn tối thiểu 3 chữ số; từ 1000 trở đi giữ nguyên số chữ số.
 * - Đơn cũ có thể là "1", "2"... hoặc "HD-ngày-XXX"; các mã này vẫn tra cứu
 *   bình thường, chỉ các đơn mới dùng định dạng HD-XXX.
 */
export const INVOICE_PREFIX = "HD-";
export const INVOICE_MIN_DIGITS = 3;

/** Định dạng số thứ tự thành mã hoá đơn HD-XXX. */
export function formatInvoiceNo(sequence: number): string {
  const safe = Math.max(1, Math.floor(sequence));
  return `${INVOICE_PREFIX}${String(safe).padStart(INVOICE_MIN_DIGITS, "0")}`;
}

/**
 * Câu SQL lấy số thứ tự lớn nhất của các mã HD-XXX hiện có.
 * Dùng SUBSTRING thay vì CAST cả chuỗi để không bị ảnh hưởng bởi mã cũ
 * dạng HD-20261007-001.
 */
export const MAX_INVOICE_SEQUENCE_SQL = `
  SELECT MAX(CAST(SUBSTRING(invoice_no, ${INVOICE_PREFIX.length + 1}) AS UNSIGNED)) AS max_no
  FROM orders
  WHERE invoice_no REGEXP '^HD-[0-9]+$'
`;

/** Tách số thứ tự từ mã HD-XXX (trả null nếu không đúng định dạng mới). */
export function parseInvoiceSequence(value: string): number | null {
  const match = /^HD-(\d+)$/i.exec(value.trim());
  if (!match) return null;
  const sequence = Number(match[1]);
  return Number.isSafeInteger(sequence) && sequence > 0 ? sequence : null;
}
