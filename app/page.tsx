"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { OverviewSection } from "@/components/dashboard/sections/overview";
import { PipelineSection } from "@/components/dashboard/sections/pipeline";
import { DealsSection } from "@/components/dashboard/sections/deals";
import { CustomersSection } from "@/components/dashboard/sections/customers";
import { EmployeesSection } from "@/components/dashboard/sections/employees";
import { ForecastingSection } from "@/components/dashboard/sections/forecasting";
import { ReportsSection } from "@/components/dashboard/sections/reports";
import { SettingsSection } from "@/components/dashboard/sections/settings";
import { OrdersHub } from "@/components/dashboard/sections/orders-hub";
import { SearchResults } from "@/components/dashboard/search-results";
import { NotificationsPage } from "@/components/dashboard/notifications-page";
import { useAuth } from "@/components/auth-context";
import { defaultDateRange, type DatePreset, type DateRange } from "@/components/dashboard/date-range-picker";
import {
  canAccessSection,
  defaultSectionFor,
  isOperationSection,
  type OperationSection,
} from "@/lib/nav";

export type Section =
  | "overview"
  | "pipeline"
  | "deals"
  | "customers"
  | "team"
  | "forecasting"
  | "reports"
  | "settings"
  | OperationSection;

type View = Section | "search" | "notifications";

export default function Dashboard() {
  const router = useRouter();
  const { currentUser, isLoading, roles } = useAuth();

  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [activeView, setActiveView] = useState<View>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>("7days");
  const [dateRange, setDateRange] = useState<DateRange>(() => defaultDateRange());

  // Mục thuộc vai trò khác (hoặc đổi tài khoản/role giữa chừng)
  // -> đưa người dùng về trang mở đầu của vai trò đó.
  useEffect(() => {
    if (!roles || roles.length === 0) return;
    if (!canAccessSection(roles, activeSection)) {
      const fallback = defaultSectionFor(roles) as Section;
      setActiveSection(fallback);
      setActiveView(fallback);
    }
  }, [roles, activeSection]);

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection dateRange={dateRange} />;
      case "pipeline":
        return <PipelineSection />;
      case "deals":
        return <OrdersHub initialQueue="all" dateRange={dateRange} />;
      case "customers":
        return <CustomersSection />;
      case "team":
        return <EmployeesSection />;
      case "forecasting":
        return <ForecastingSection />;
      case "reports":
        return <ReportsSection />;
      case "settings":
        return <SettingsSection />;
      case "sale-orders":
        return <OrdersHub initialQueue="kinh_doanh" dateRange={dateRange} />;
      case "warehouse-orders":
        return <OrdersHub initialQueue="kho" dateRange={dateRange} />;
      case "technical-orders":
        return <OrdersHub initialQueue="ky_thuat" dateRange={dateRange} />;
      case "warranty-orders":
        return <OrdersHub initialQueue="bao_hanh" dateRange={dateRange} />;
      case "shipping-orders":
        return <OrdersHub initialQueue="quan_ly_ship" dateRange={dateRange} />;
      case "shipper-orders":
        return <OrdersHub initialQueue="shipper" dateRange={dateRange} />;
      case "accounting-orders":
        return <OrdersHub initialQueue="all" dateRange={dateRange} />;
      default:
        return <OverviewSection dateRange={dateRange} />;
    }
  };

  const handleSectionChange = (section: Section) => {
    if (!canAccessSection(roles, section)) return;
    setActiveSection(section);
    setActiveView(section);
  };

  // Bấm thông báo ở bất kỳ đâu -> nhảy về Trung tâm đơn hàng (ai cũng xem được)
  useEffect(() => {
    const handler = () => {
      if (canAccessSection(roles, "deals")) {
        setActiveSection("deals");
        setActiveView("deals");
      }
    };
    window.addEventListener("pcm:open-order", handler);
    return () => window.removeEventListener("pcm:open-order", handler);
  }, [roles]);

  // Session is being restored from the httpOnly cookie
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  // No valid session (middleware usually redirects before this point)
  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <button
          onClick={() => router.replace("/login")}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
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
          onSearch={(query) => { setSearchQuery(query); setActiveView("search"); }}
          onNotifications={() => setActiveView("notifications")}
          onOpenAccounts={() => handleSectionChange("team")}
          datePreset={datePreset}
          dateRange={dateRange}
          onDateRangeChange={(preset, range) => { setDatePreset(preset); setDateRange(range); }}
        />
        <main className="flex-1 p-6 overflow-auto">
          <div
            key={activeSection}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            {activeView === "search" ? <SearchResults query={searchQuery} onClose={() => setActiveView(activeSection)} /> : activeView === "notifications" ? <NotificationsPage /> : renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}
