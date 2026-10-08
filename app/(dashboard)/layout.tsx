import React from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

/** Layout dùng chung cho mọi route dashboard (MPA: mỗi URL là 1 trang riêng). */
export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
