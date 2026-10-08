"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { useAuth } from "@/components/auth-context";
import { defaultDateRange, type DatePreset, type DateRange } from "@/components/dashboard/date-range-picker";
import { canAccessSection, defaultHrefFor, sectionForPath } from "@/lib/nav";

interface DashboardDateContextType {
  datePreset: DatePreset;
  dateRange: DateRange;
  onDateRangeChange: (preset: DatePreset, range: DateRange) => void;
}

const DashboardDateContext = createContext<DashboardDateContextType | undefined>(undefined);

/** Các section/màn hình đọc date filter của header qua hook này (MPA: state nằm ở shell). */
export function useDashboardDate(): DashboardDateContextType {
  const ctx = useContext(DashboardDateContext);
  if (!ctx) {
    const range = defaultDateRange();
    return { datePreset: "7days" as DatePreset, dateRange: range, onDateRangeChange: () => {} };
  }
  return ctx;
}

/**
 * Shell dùng chung cho mọi route dashboard (MPA).
 * Mỗi URL là 1 route riêng, shell chỉ lo: guard auth, sidebar, header, date filter.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, isLoading, roles } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>("7days");
  const [dateRange, setDateRange] = useState<DateRange>(() => defaultDateRange());

  const activeSection = sectionForPath(pathname);

  // Chưa có session -> middleware thường redirect trước, đây là lớp dự phòng.
  // Có session nhưng sai role cho route hiện tại -> đưa về route mặc định của role.
  useEffect(() => {
    if (isLoading || !currentUser) return;
    const section = sectionForPath(pathname);
    // search/notifications là view phụ, ai đăng nhập cũng xem được
    if (section === "search" || section === "notifications") return;
    if (!canAccessSection(roles, section)) {
      router.replace(defaultHrefFor(roles));
    }
  }, [isLoading, currentUser, roles, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Link
          href="/login"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <DashboardDateContext.Provider
      value={{ datePreset, dateRange, onDateRangeChange: (preset, range) => { setDatePreset(preset); setDateRange(range); } }}
    >
      <div className="flex min-h-screen bg-background">
        <Sidebar
          activeSection={activeSection}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ease-out ${
            sidebarCollapsed ? "ml-[72px]" : "ml-[260px]"
          }`}
        >
          <Header
            activeSection={activeSection}
            datePreset={datePreset}
            dateRange={dateRange}
            onDateRangeChange={(preset, range) => { setDatePreset(preset); setDateRange(range); }}
          />
          <main className="flex-1 p-6 overflow-auto">
            <div
              key={pathname}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </DashboardDateContext.Provider>
  );
}
