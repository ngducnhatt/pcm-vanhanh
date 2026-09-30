import {
  getNextStatusAfterKhoDone,
  getNextStatusAfterKithuatDone,
  getNextStatusAfterBaohanhDone,
  requiresRollbackToKho,
  shouldCompleteOrder,
} from '../lib/state-machine';

console.log('====================================================');
console.log('CHƯƠNG TRÌNH KIỂM THỬ LUỒNG NGHIỆP VỤ & STATE MACHINE');
console.log('====================================================\n');

function runTest(testName: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ [PASS] ${testName}`);
  } catch (err: any) {
    console.error(`❌ [FAIL] ${testName}:`, err.message);
    process.exit(1);
  }
}

// 1. Test Tag routing priority: Tech first, Warranty second
runTest('State Machine: Điều hướng tuần tự theo Tag sau khi Kho Xuất (kho_done)', () => {
  // Case A: Đơn có cả tag kỹ thuật và bảo hành -> Kỹ thuật xử lý trước
  const next1 = getNextStatusAfterKhoDone(['moi', 'kithuat', 'baohanh']);
  if (next1 !== 'kithuat_pending') {
    throw new Error(`Kỳ vọng kithuat_pending nhưng nhận ${next1}`);
  }

  // Case B: Kỹ thuật xong -> Tiếp tục sang bảo hành
  const next2 = getNextStatusAfterKithuatDone(['moi', 'kithuat', 'baohanh']);
  if (next2 !== 'baohanh_pending') {
    throw new Error(`Kỳ vọng baohanh_pending nhưng nhận ${next2}`);
  }

  // Case C: Bảo hành xong -> Chuyển sang ship
  const next3 = getNextStatusAfterBaohanhDone();
  if (next3 !== 'ship_pending') {
    throw new Error(`Kỳ vọng ship_pending nhưng nhận ${next3}`);
  }

  // Case D: Đơn chỉ có tag bảo hành (không có kỹ thuật) -> Nhảy thẳng sang bảo hành
  const next4 = getNextStatusAfterKhoDone(['moi', 'baohanh']);
  if (next4 !== 'baohanh_pending') {
    throw new Error(`Kỳ vọng baohanh_pending nhưng nhận ${next4}`);
  }

  // Case E: Đơn không có tag kỹ thuật & bảo hành -> Nhảy thẳng sang ship_pending
  const next5 = getNextStatusAfterKhoDone(['moi']);
  if (next5 !== 'ship_pending') {
    throw new Error(`Kỳ vọng ship_pending nhưng nhận ${next5}`);
  }
});

// 2. Test Rollback rule
runTest('Rollback: Sửa đơn sau khi kho_done trở đi bắt buộc Rollback về kho_pending', () => {
  if (!requiresRollbackToKho('kho_done')) throw new Error('kho_done phải rollback');
  if (!requiresRollbackToKho('kithuat_pending')) throw new Error('kithuat_pending phải rollback');
  if (!requiresRollbackToKho('baohanh_pending')) throw new Error('baohanh_pending phải rollback');
  if (!requiresRollbackToKho('ship_pending')) throw new Error('ship_pending phải rollback');
  if (!requiresRollbackToKho('ship_dangiao')) throw new Error('ship_dangiao phải rollback');
  if (requiresRollbackToKho('draft')) throw new Error('draft không cần rollback');
  if (requiresRollbackToKho('new')) throw new Error('new không cần rollback');
  if (requiresRollbackToKho('kho_pending')) throw new Error('kho_pending không cần rollback');
});

// 3. Test Auto Completion rule
runTest('Hoàn tất đơn (completed): Chỉ khi ship_done VÀ payment_status = full', () => {
  if (shouldCompleteOrder('ship_dangiao', 'full')) {
    throw new Error('Đang giao chưa thể hoàn tất');
  }
  if (shouldCompleteOrder('ship_done', 'partial')) {
    throw new Error('Giao xong nhưng mới thanh toán một phần chưa thể hoàn tất');
  }
  if (shouldCompleteOrder('ship_done', 'unpaid')) {
    throw new Error('Giao xong nhưng chưa thanh toán chưa thể hoàn tất');
  }
  if (!shouldCompleteOrder('ship_done', 'full')) {
    throw new Error('Đã giao xong và thanh toán full PHẢI tự động hoàn tất');
  }
});

console.log('\n====================================================');
console.log('🎉 TẤT CẢ CÁC BÀI TEST NGHIỆP VỤ & STATE MACHINE ĐÃ ĐẠT 100%!');
console.log('====================================================');
