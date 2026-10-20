import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canCancelOrder,
  canEditOrder,
  canPerformAction,
  getNextStatusAfterBaohanhDone,
  getNextStatusAfterKhoDone,
  getNextStatusAfterKithuatDone,
  getRoleQueueStatuses,
  hasShippingTag,
  hasTechnicalTag,
  hasWarrantyTag,
  requiresRollbackToKho,
  shouldCompleteOrder,
} from '../lib/state-machine';

describe('state-machine: tags', () => {
  it('nhận diện tag kỹ thuật có dấu / không dấu / tiếng Anh', () => {
    assert.equal(hasTechnicalTag(['kỹ thuật']), true);
    assert.equal(hasTechnicalTag(['ky_thuat']), true);
    assert.equal(hasTechnicalTag(['technical']), true);
    assert.equal(hasTechnicalTag(['bảo hành']), false);
  });

  it('nhận diện tag bảo hành', () => {
    assert.equal(hasWarrantyTag(['bảo hành']), true);
    assert.equal(hasWarrantyTag(['baohanh']), true);
    assert.equal(hasWarrantyTag(['ship']), false);
  });

  it('nhận diện tag giao hàng', () => {
    assert.equal(hasShippingTag(['ship']), true);
    assert.equal(hasShippingTag(['giao hàng']), true);
    assert.equal(hasShippingTag(['kithuat']), false);
  });
});

describe('state-machine: chuyển trạng thái', () => {
  it('kho_done ưu tiên kỹ thuật > bảo hành > giao hàng', () => {
    assert.equal(getNextStatusAfterKhoDone(['kithuat', 'baohanh']), 'kithuat_pending');
    assert.equal(getNextStatusAfterKhoDone(['baohanh']), 'baohanh_pending');
    assert.equal(getNextStatusAfterKhoDone([]), 'ship_pending');
  });

  it('kithuat_done -> bảo hành (nếu có tag) hoặc giao hàng', () => {
    assert.equal(getNextStatusAfterKithuatDone(['baohanh']), 'baohanh_pending');
    assert.equal(getNextStatusAfterKithuatDone([]), 'ship_pending');
  });

  it('baohanh_done luôn -> ship_pending', () => {
    assert.equal(getNextStatusAfterBaohanhDone(), 'ship_pending');
  });

  it('hoàn tất đơn khi ship_done + thanh toán đủ', () => {
    assert.equal(shouldCompleteOrder('ship_done', 'full'), true);
    assert.equal(shouldCompleteOrder('ship_done', 'partial'), false);
    assert.equal(shouldCompleteOrder('ship_assigned', 'full'), false);
  });

  it('rollback về kho_pending sau kho_done', () => {
    assert.equal(requiresRollbackToKho('kho_done'), true);
    assert.equal(requiresRollbackToKho('ship_dangiao'), true);
    assert.equal(requiresRollbackToKho('new'), false);
  });

  it('không sửa/hủy đơn đã hoàn tất hoặc đã hủy', () => {
    assert.equal(canEditOrder('completed'), false);
    assert.equal(canEditOrder('cancelled'), false);
    assert.equal(canEditOrder('kho_pending'), true);
    assert.equal(canCancelOrder('completed'), false);
    assert.equal(canCancelOrder('ship_done'), true);
  });
});

describe('state-machine: quyền theo vai trò', () => {
  it('admin được mọi hành động', () => {
    assert.equal(canPerformAction('admin', 'export_kho', 'ship_done'), true);
  });

  it('kho chỉ xuất kho khi đơn ở kho_pending', () => {
    assert.equal(canPerformAction('kho', 'export_kho', 'kho_pending'), true);
    assert.equal(canPerformAction('kho', 'export_kho', 'ship_done'), false);
    assert.equal(canPerformAction('kho', 'complete_kithuat', 'kithuat_pending'), false);
  });

  it('kỹ thuật hoàn thành khi kithuat_pending, bảo hành khi baohanh_pending', () => {
    assert.equal(canPerformAction('ky_thuat', 'complete_kithuat', 'kithuat_pending'), true);
    assert.equal(canPerformAction('ky_thuat', 'complete_kithuat', 'baohanh_pending'), false);
    assert.equal(canPerformAction('bao_hanh', 'complete_baohanh', 'baohanh_pending'), true);
    assert.equal(canPerformAction('bao_hanh', 'complete_baohanh', 'kithuat_pending'), false);
  });

  it('shipper chỉ giao hàng khi đúng trạng thái', () => {
    assert.equal(canPerformAction('shipper', 'start_delivery', 'ship_assigned'), true);
    assert.equal(canPerformAction('shipper', 'start_delivery', 'ship_pending'), false);
    assert.equal(canPerformAction('shipper', 'complete_delivery', 'ship_dangiao'), true);
    assert.equal(canPerformAction('shipper', 'complete_delivery', 'ship_assigned'), false);
  });

  it('quản lý kỹ thuật CHỈ giám sát (không duyệt)', () => {
    assert.equal(canPerformAction('quan_ly_ky_thuat', 'complete_kithuat', 'kithuat_pending'), false);
  });

  it('kinh_doanh không được xuất kho', () => {
    assert.equal(canPerformAction('kinh_doanh', 'export_kho', 'kho_pending'), false);
    assert.equal(canPerformAction('kinh_doanh', 'create_order'), true);
  });
});

describe('state-machine: hàng đợi theo vai trò', () => {
  it('admin / kinh doanh xem tất cả (null)', () => {
    assert.equal(getRoleQueueStatuses('admin'), null);
    assert.equal(getRoleQueueStatuses('kinh_doanh'), null);
  });

  it('kho chỉ thấy trạng thái kho', () => {
    assert.deepEqual(getRoleQueueStatuses('kho'), ['new', 'kho_pending', 'kho_done']);
  });

  it('shipper không thấy hàng đợi "chờ phân công"', () => {
    const queue = getRoleQueueStatuses('shipper') ?? [];
    assert.equal(queue.includes('ship_pending'), false);
  });
});
