import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatInvoiceNo, parseInvoiceSequence, INVOICE_PREFIX } from '../lib/invoice';

describe('invoice: mã hoá đơn', () => {
  it('định dạng chuẩn HD-XXX với tối thiểu 3 chữ số', () => {
    assert.equal(formatInvoiceNo(1), 'HD-001');
    assert.equal(formatInvoiceNo(999), 'HD-999');
    assert.equal(formatInvoiceNo(1000), 'HD-1000');
  });

  it('đảo ngược được số thứ tự từ mã', () => {
    assert.equal(parseInvoiceSequence('HD-001'), 1);
    assert.equal(parseInvoiceSequence('HD-1000'), 1000);
    assert.equal(parseInvoiceSequence('hd-42'), 42, 'không phân biệt hoa thường');
  });

  it('mã cũ (kiểu HD-20261007-001) trả null', () => {
    assert.equal(parseInvoiceSequence('HD-20261007-001'), null);
    assert.equal(parseInvoiceSequence('abc'), null);
    assert.equal(parseInvoiceSequence(''), null);
  });

  it('số không hợp lệ bị chặn (không sinh mã <= 0)', () => {
    assert.equal(formatInvoiceNo(0), `${INVOICE_PREFIX}001`);
    assert.equal(formatInvoiceNo(-5), `${INVOICE_PREFIX}001`);
    assert.equal(parseInvoiceSequence('HD-0'), null);
  });
});
