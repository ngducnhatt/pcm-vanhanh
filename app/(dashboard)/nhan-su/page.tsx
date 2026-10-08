import type { Metadata } from "next";
import { EmployeesSection } from "@/components/dashboard/sections/employees";

export const metadata: Metadata = { title: "Nhân viên & Vai trò | PCM Vận Hành" };

export default function NhanSuPage() {
  return <EmployeesSection />;
}
