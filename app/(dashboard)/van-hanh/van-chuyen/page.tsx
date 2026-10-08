import type { Metadata } from "next";
import { OrdersHubWithDate } from "@/components/dashboard/section-wrappers";

export const metadata: Metadata = { title: "Vận chuyển | PCM Vận Hành" };

export default function VanChuyenPage() {
  return <OrdersHubWithDate queue="quan_ly_ship" />;
}
