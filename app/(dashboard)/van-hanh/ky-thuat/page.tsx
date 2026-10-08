import type { Metadata } from "next";
import { OrdersHubWithDate } from "@/components/dashboard/section-wrappers";

export const metadata: Metadata = { title: "Kỹ thuật | PCM Vận Hành" };

export default function KyThuatPage() {
  return <OrdersHubWithDate queue="ky_thuat" />;
}
