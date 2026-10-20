import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { can, canManageAccounts, statusFromError, AuthError } from '../lib/permissions';

describe('permissions: ma trận RBAC', () => {
  it('admin có mọi quyền', () => {
    assert.equal(can('admin', 'account:manage'), true);
    assert.equal(can('admin', 'order:export_kho'), true);
    assert.equal(can('admin', 'order:collect_payment'), true);
  });

  it('kinh_doanh tạo/sửa đơn nhưng không xuất kho', () => {
    assert.equal(can('kinh_doanh', 'order:create'), true);
    assert.equal(can('kinh_doanh', 'order:export_kho'), false);
    assert.equal(can('kinh_doanh', 'account:manage'), false);
  });

  it('kho xuất kho nhưng không tạo đơn', () => {
    assert.equal(can('kho', 'order:export_kho'), true);
    assert.equal(can('kho', 'order:create'), false);
    assert.equal(can('kho', 'order:complete_kithuat'), false);
  });

  it('shipper thu tiền + giao hàng, không quản trị tài khoản', () => {
    assert.equal(can('shipper', 'order:collect_payment'), true);
    assert.equal(can('shipper', 'order:complete_delivery'), true);
    assert.equal(can('shipper', 'account:manage'), false);
  });

  it('quản lý kỹ thuật chỉ có report:read', () => {
    assert.equal(can('quan_ly_ky_thuat', 'report:read'), true);
    assert.equal(can('quan_ly_ky_thuat', 'order:complete_kithuat'), false);
  });

  it('mảng vai trò = liên kết OR', () => {
    assert.equal(can(['shipper', 'kinh_doanh'], 'order:create'), true);
    assert.equal(can(['shipper', 'kinh_doanh'], 'order:export_kho'), false);
  });
  it('giá trị không hợp lệ trả false', () => {
    assert.equal(can(undefined, 'order:create'), false);
    assert.equal(can([], 'order:create'), false);
    assert.equal(can('ghost-role' as never, 'order:create'), false);
  });

  it('chỉ admin được quản trị tài khoản', () => {
    assert.equal(canManageAccounts('admin'), true);
    assert.equal(canManageAccounts('kinh_doanh'), false);
  });
});

describe('permissions: statusFromError', () => {
  it('giữ nguyên status 4xx/5xx hợp lệ', () => {
    assert.equal(statusFromError(new AuthError('x', 403)), 403);
    assert.equal(statusFromError({ status: 404 }), 404);
    assert.equal(statusFromError({ status: 409 }), 409);
  });

  it('lỗi không có status -> 500', () => {
    assert.equal(statusFromError(new Error('boom')), 500);
    assert.equal(statusFromError(null), 500);
    assert.equal(statusFromError({ status: 99 }), 500);
  });
});
