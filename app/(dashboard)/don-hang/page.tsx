import type { Metadata } from "next";
import { OrdersHubWithDate } from "@/components/dashboard/section-wrappers";

export const metadata: Metadata = { title: "Trung tâm đơn hàng | PCM Vận Hành" };

export default function DonHangPage() {
  return <OrdersHubWithDate queue="all" />;
}
