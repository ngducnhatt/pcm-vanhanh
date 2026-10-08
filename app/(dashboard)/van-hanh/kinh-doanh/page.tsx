import type { Metadata } from "next";
import { OrdersHubWithDate } from "@/components/dashboard/section-wrappers";

export const metadata: Metadata = { title: "Kinh doanh | PCM Vận Hành" };

export default function KinhDoanhPage() {
  return <OrdersHubWithDate queue="kinh_doanh" />;
}
