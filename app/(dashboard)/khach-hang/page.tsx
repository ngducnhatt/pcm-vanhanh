import type { Metadata } from "next";
import { CustomersSection } from "@/components/dashboard/sections/customers";

export const metadata: Metadata = { title: "Khách hàng | PCM Vận Hành" };

export default function KhachHangPage() {
  return <CustomersSection />;
}
