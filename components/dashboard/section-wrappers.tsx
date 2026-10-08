"use client";

import { OrdersHub } from "@/components/dashboard/sections/orders-hub";
import { OverviewSection } from "@/components/dashboard/sections/overview";
import { useDashboardDate } from "@/components/dashboard/dashboard-shell";

/** Wrapper client đọc date filter từ DashboardShell (MPA) rồi truyền xuống section. */
export function OverviewWithDate() {
  const { dateRange } = useDashboardDate();
  return <OverviewSection dateRange={dateRange} />;
}

export function OrdersHubWithDate({ queue }: { queue?: string }) {
  const { dateRange } = useDashboardDate();
  return <OrdersHub initialQueue={queue ?? "all"} dateRange={dateRange} />;
}
