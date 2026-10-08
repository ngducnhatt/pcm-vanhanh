import type { Metadata } from "next";
import { OrdersHubWithDate } from "@/components/dashboard/section-wrappers";

export const metadata: Metadata = { title: "Bảo hành | PCM Vận Hành" };

export default function BaoHanhPage() {
  return <OrdersHubWithDate queue="bao_hanh" />;
}
