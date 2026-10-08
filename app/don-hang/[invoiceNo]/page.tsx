import type { Metadata } from "next";
import { OrderTrackingPage } from "@/components/orders/order-tracking-page";

export const metadata: Metadata = { title: "Chi tiết đơn hàng | PCM" };

/**
 * Link duy nhất của mỗi đơn: /don-hang/1, /don-hang/2, ...
 * - Nhân viên đã đăng nhập: xem toàn bộ chi tiết, không cần nhập gì.
 * - Khách chưa đăng nhập: nhập đúng SĐT đặt hàng để xem hóa đơn, trạng thái,
 *   thanh toán, vận chuyển (dữ liệu đã lược bỏ thông tin nội bộ).
 */
export default async function DonHangChiTietPage({
  params,
}: {
  params: Promise<{ invoiceNo: string }>;
}) {
  const { invoiceNo } = await params;
  return <OrderTrackingPage invoiceNo={invoiceNo} />;
}
