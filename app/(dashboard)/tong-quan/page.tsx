import type { Metadata } from "next";
import { OverviewWithDate } from "@/components/dashboard/section-wrappers";

export const metadata: Metadata = { title: "Tổng quan | PCM Vận Hành" };

export default function TongQuanPage() {
  return <OverviewWithDate />;
}
