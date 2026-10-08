import type { Metadata } from "next";
import { SettingsSection } from "@/components/dashboard/sections/settings";

export const metadata: Metadata = { title: "Cài đặt | PCM Vận Hành" };

export default function CaiDatPage() {
  return <SettingsSection />;
}
