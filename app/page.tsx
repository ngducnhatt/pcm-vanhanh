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
  const { currentUser, isLoading, role } = useAuth();

  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [activeView, setActiveView] = useState<View>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Mục thuộc vai trò khác (hoặc đổi tài khoản/role giữa chừng)
  // -> đưa người dùng về trang mở đầu của vai trò đó.
  useEffect(() => {
    if (!role) return;
    if (!canAccessSection(role, activeSection)) {
      const fallback = defaultSectionFor(role) as Section;
      setActiveSection(fallback);
      setActiveView(fallback);
    }
  }, [role, activeSection]);

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection />;
      case "pipeline":
        return <PipelineSection />;
      case "deals":
        return <OrdersHub initialQueue="all" />;
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
        return <OrdersHub initialQueue="kinh_doanh" />;
      case "warehouse-orders":
        return <OrdersHub initialQueue="kho" />;
      case "technical-orders":
        return <OrdersHub initialQueue="ky_thuat" />;
      case "warranty-orders":
        return <OrdersHub initialQueue="bao_hanh" />;
      case "shipping-orders":
        return <OrdersHub initialQueue="quan_ly_ship" />;
      case "shipper-orders":
        return <OrdersHub initialQueue="shipper" />;
      case "accounting-orders":
        return <OrdersHub initialQueue="all" />;
      default:
        return <OverviewSection />;
    }
  };

  const handleSectionChange = (section: Section) => {
    if (!canAccessSection(role, section)) return;
    setActiveSection(section);
    setActiveView(section);
  };

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
