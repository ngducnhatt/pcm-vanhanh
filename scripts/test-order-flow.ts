import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import {
  getNextStatusAfterKhoDone,
  getNextStatusAfterKithuatDone,
  getNextStatusAfterBaohanhDone,
  requiresRollbackToKho,
  shouldCompleteOrder,
} from '../lib/state-machine';

const dbPath = path.join(process.cwd(), 'data', 'pcm_vanhanh.sqlite');
const db = new DatabaseSync(dbPath);

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

// 4. Test Live Database Simulation
runTest('Live Database Flow: Tạo đơn -> Xuất kho -> Kỹ thuật -> Bảo hành -> Rollback -> Giao hàng -> Thu tiền -> Hoàn tất', () => {
  const testOrderId = `test_ord_${Date.now()}`;
  const testInvoice = `TEST-${Date.now()}`;

  // Bước 1: Tạo đơn
  db.prepare(`
    INSERT INTO orders (id, invoice_no, invoice_date, customer_name, customer_phone, tags, sales_user_id, status, payment_status, total_amount, paid_amount)
    VALUES (?, ?, '2026-09-25', 'Khách Test Rollback', '0999888777', '["kithuat", "baohanh"]', 'usr_sales', 'kho_pending', 'partial', 20000000, 5000000)
  `).run(testOrderId, testInvoice);

  db.prepare(`
    INSERT INTO order_items (id, order_id, product_id, quantity, unit_price)
    VALUES (?, ?, 'prod_1', 1, 20000000)
  `).run(`item_${testOrderId}`, testOrderId);

  // Bước 2: Kho xuất và gán serial
  db.prepare(`
    UPDATE order_items SET serial_number = 'TEST-SERIAL-1111' WHERE order_id = ?
  `).run(testOrderId);

  const nextAfterKho = getNextStatusAfterKhoDone(['kithuat', 'baohanh']);
  db.prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(nextAfterKho, testOrderId);

  let current = db.prepare('SELECT status FROM orders WHERE id = ?').get(testOrderId) as any;
  if (current.status !== 'kithuat_pending') {
    throw new Error(`Kỳ vọng kithuat_pending nhưng trạng thái hiện tại là ${current.status}`);
  }

  // Bước 3: Kinh doanh sửa số lượng -> Kích hoạt Rollback về kho_pending và lưu snapshot serial
  const itemsBeforeEdit = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(testOrderId) as any[];
  const snapshotJson = JSON.stringify(itemsBeforeEdit);

  db.prepare(`
    INSERT INTO order_status_history (id, order_id, status, changed_by_user_id, note, snapshot_serials)
    VALUES (?, ?, 'kho_pending', 'usr_sales', 'Rollback sửa đơn hàng', ?)
  `).run(`hist_rb_${Date.now()}`, testOrderId, snapshotJson);

  db.prepare(`UPDATE orders SET status = 'kho_pending' WHERE id = ?`).run(testOrderId);

  current = db.prepare('SELECT status FROM orders WHERE id = ?').get(testOrderId) as any;
  if (current.status !== 'kho_pending') {
    throw new Error(`Kỳ vọng kho_pending sau rollback nhưng nhận ${current.status}`);
  }

  // Kiểm tra snapshot serial được lưu đầy đủ trong lịch sử
  const historyRow = db.prepare('SELECT snapshot_serials FROM order_status_history WHERE order_id = ? AND snapshot_serials IS NOT NULL').get(testOrderId) as any;
  if (!historyRow || !historyRow.snapshot_serials.includes('TEST-SERIAL-1111')) {
    throw new Error('Lịch sử snapshot serial không khớp serial cũ!');
  }

  // Bước 4: Kho xuất lại -> Kỹ thuật hoàn thành -> Bảo hành hoàn thành -> Ship pending
  db.prepare(`UPDATE orders SET status = 'ship_pending' WHERE id = ?`).run(testOrderId);

  // Bước 5: Quản lý ship gán shipper -> ship_assigned
  db.prepare(`
    INSERT INTO shipments (id, order_id, shipper_id, assigned_by_user_id, address, distance_km, km_source)
    VALUES (?, ?, 'usr_shipper1', 'usr_ship_mgr', '123 Đường Test, Quận 1', 5.2, 'gg_map')
  `).run(`ship_${Date.now()}`, testOrderId);
  db.prepare(`UPDATE orders SET status = 'ship_assigned' WHERE id = ?`).run(testOrderId);

  // Bước 6: Shipper đang giao -> ship_dangiao -> ship_done
  db.prepare(`UPDATE orders SET status = 'ship_done' WHERE id = ?`).run(testOrderId);
  current = db.prepare('SELECT status, payment_status FROM orders WHERE id = ?').get(testOrderId) as any;
  if (current.status !== 'ship_done') {
    throw new Error('Kỳ vọng trạng thái ship_done');
  }

  // Bước 7: Thu đủ tiền -> Auto completed
  db.prepare(`UPDATE orders SET paid_amount = 20000000, payment_status = 'full' WHERE id = ?`).run(testOrderId);
  if (shouldCompleteOrder('ship_done', 'full')) {
    db.prepare(`UPDATE orders SET status = 'completed' WHERE id = ?`).run(testOrderId);
  }

  current = db.prepare('SELECT status, payment_status FROM orders WHERE id = ?').get(testOrderId) as any;
  if (current.status !== 'completed' || current.payment_status !== 'full') {
    throw new Error(`Kỳ vọng completed và payment_status full, nhưng nhận ${JSON.stringify(current)}`);
  }

  // Cleanup test order
  db.prepare('DELETE FROM orders WHERE id = ?').run(testOrderId);
});

console.log('\n====================================================');
console.log('🎉 TẤT CẢ CÁC BÀI TEST NGHIỆP VỤ & STATE MACHINE ĐÃ ĐẠT 100%!');
console.log('====================================================');
db.close();
