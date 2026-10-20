import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone, phonesMatch } from '../lib/order-detail';
import { normalizeIp } from '../lib/request-ip';
import { rateLimit, resetRateLimits } from '../lib/rate-limit';
import { toSafeError } from '../lib/api-error';
import { AuthError } from '../lib/permissions';

describe('order-detail: chuẩn hoá SĐT khách hàng', () => {
  it('bỏ ký tự không phải số', () => {
    assert.equal(normalizePhone('0901 234.567'), '0901234567');
    assert.equal(normalizePhone('(0901)-234-567'), '0901234567');
  });

  it('đổi đầu +84 / 84 / 0084 về 0', () => {
    assert.equal(normalizePhone('+84901234567'), '0901234567');
    assert.equal(normalizePhone('84901234567'), '0901234567');
    assert.equal(normalizePhone('0084901234567'), '0901234567');
  });

  it('phonesMatch yêu cầu SĐT đủ dài và khớp', () => {
    assert.equal(phonesMatch('0901234567', '0901 234 567'), true);
    assert.equal(phonesMatch('0901234568', '0901234567'), false);
    assert.equal(phonesMatch('123', '123'), false, 'quá ngắn phải bị từ chối');
    assert.equal(phonesMatch('', '0901234567'), false);
    assert.equal(phonesMatch(null, undefined), false);
  });
});

describe('request-ip: chỉ tin header proxy hợp lệ', () => {
  it('chấp nhận IPv4/IPv6 hợp lệ, từ chối chuỗi rác', () => {
    assert.equal(normalizeIp('1.2.3.4'), '1.2.3.4');
    assert.equal(normalizeIp('1.2.3.4:5678'), '1.2.3.4');
    assert.equal(normalizeIp('[::1]:443'), '::1');
    assert.equal(normalizeIp('1.2.3.4, 5.6.7.8'), null, 'phải cắt trước khi kiểm tra');
    assert.equal(normalizeIp('not-an-ip'), null);
    assert.equal(normalizeIp(''), null);
    assert.equal(normalizeIp(null), null);
  });
});

describe('rate-limit: cửa sổ giới hạn', () => {
  it('cho phép đúng `limit` lần rồi chặn', () => {
    resetRateLimits();
    const opts = { limit: 3, windowMs: 60_000 };
    assert.equal(rateLimit('k', opts).allowed, true);
    assert.equal(rateLimit('k', opts).allowed, true);
    const third = rateLimit('k', opts);
    assert.equal(third.allowed, true);
    assert.equal(third.remaining, 0);

    const blocked = rateLimit('k', opts);
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfterSeconds >= 1);
  });

  it('mỗi khoá độc lập', () => {
    resetRateLimits();
    const opts = { limit: 1, windowMs: 60_000 };
    assert.equal(rateLimit('a', opts).allowed, true);
    assert.equal(rateLimit('b', opts).allowed, true);
    assert.equal(rateLimit('a', opts).allowed, false);
  });

  it('hết cửa sổ thì đếm lại', () => {
    resetRateLimits();
    const opts = { limit: 1, windowMs: 1 };
    assert.equal(rateLimit('c', opts).allowed, true);
    assert.equal(rateLimit('c', opts).allowed, false);
    // Đợi chắc chắn cửa sổ trôi qua (kể cả trên CI chậm).
    const until = Date.now() + 50;
    while (Date.now() < until) { /* spin */ }
    assert.equal(rateLimit('c', opts).allowed, true);
  });
});

describe('api-error: không lộ lỗi hệ thống', () => {
  it('giữ message lỗi 4xx có chủ đích (AuthError)', () => {
    const safe = toSafeError(new AuthError('Bạn không có quyền', 403), 'fallback');
    assert.equal(safe.message, 'Bạn không có quyền');
    assert.equal(safe.status, 403);
  });

  it('thay message lỗi 5xx bằng thông báo chung (không lộ SQL/stack)', () => {
    const internal = new Error("ER_DUP_ENTRY: Duplicate entry 'x' for key 'orders.invoice_no'");
    const safe = toSafeError(internal, 'Lỗi hệ thống khi đăng nhập');
    assert.equal(safe.message, 'Lỗi hệ thống khi đăng nhập');
    assert.equal(safe.status, 500);
    assert.equal(safe.message.includes('ER_DUP_ENTRY'), false);
  });

  it('lỗi không phải Error cũng không rò rỉ ra client', () => {
    const safe = toSafeError('secret internal string', 'Thông báo chung');
    assert.equal(safe.message, 'Thông báo chung');
    assert.equal(safe.status, 500);
  });
});
