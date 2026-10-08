import type { Metadata } from "next";
import { OrdersHubWithDate } from "@/components/dashboard/section-wrappers";

export const metadata: Metadata = { title: "Kho | PCM Vận Hành" };

export default function KhoPage() {
  return <OrdersHubWithDate queue="kho" />;
}
