import type { Metadata } from "next";
import { PipelineSection } from "@/components/dashboard/sections/pipeline";

export const metadata: Metadata = { title: "Kho & Linh kiện | PCM Vận Hành" };

export default function KhoLinhKienPage() {
  return <PipelineSection />;
}
