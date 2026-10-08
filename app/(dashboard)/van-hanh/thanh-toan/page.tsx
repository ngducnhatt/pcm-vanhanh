import type { Metadata } from "next";
import { OrdersHubWithDate } from "@/components/dashboard/section-wrappers";

export const metadata: Metadata = { title: "Thanh toán | PCM Vận Hành" };

export default function ThanhToanPage() {
  return <OrdersHubWithDate queue="all" />;
}
