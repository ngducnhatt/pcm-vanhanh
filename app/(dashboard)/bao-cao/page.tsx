import type { Metadata } from "next";
import { ReportsSection } from "@/components/dashboard/sections/reports";

export const metadata: Metadata = { title: "Báo cáo doanh thu | PCM Vận Hành" };

export default function BaoCaoPage() {
  return <ReportsSection />;
}
