import type { Metadata } from "next";
import { ForecastingSection } from "@/components/dashboard/sections/forecasting";

export const metadata: Metadata = { title: "Dự báo doanh thu | PCM Vận Hành" };

export default function DuBaoPage() {
  return <ForecastingSection />;
}
