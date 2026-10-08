import type { Metadata } from "next";
import { OrdersHubWithDate } from "@/components/dashboard/section-wrappers";

export const metadata: Metadata = { title: "Đơn giao của tôi | PCM Vận Hành" };

export default function GiaoHangPage() {
  return <OrdersHubWithDate queue="shipper" />;
}
