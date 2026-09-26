"use client";

import { cn } from "@/lib/utils";
import { FIELD_BASE, SECTION_TITLE, SURFACE_CARD, TONE_SURFACE, type Tone } from "@/lib/ui";
import type { Section } from "@/app/page";
import { Bell, Search, AlertTriangle, Package, X, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { UserMenu } from "@/components/user-menu";

interface HeaderProps {
  activeSection: Section;
  onSearch: (query: string) => void;
  onNotifications: () => void;
  onOpenAccounts?: () => void;
}

const sectionTitles: Record<Section, string> = {
  overview: "Tổng quan",
  pipeline: "Quy trình bán hàng",
  deals: "Đơn sale",
  customers: "Khách hàng",
  team: "Nhân viên & Vai trò",
  forecasting: "Dự báo doanh thu",
  reports: "Giao dịch",
  settings: "Cài đặt",
  "sale-orders": "Đơn sale",
  "warehouse-orders": "Đơn kho",
  "technical-orders": "Đơn kỹ thuật",
  "warranty-orders": "Đơn bảo hành",
  "shipping-orders": "Vận chuyển & Phân ship",
  "shipper-orders": "Đơn giao của tôi",
  "accounting-orders": "Đơn kế toán",
};

export function Header({ activeSection, onSearch, onNotifications, onOpenAccounts }: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notifications: {
    icon: LucideIcon;
    title: string;
    description: string;
    time: string;
    tone: Tone;
  }[] = [
    { icon: AlertTriangle, title: "Đơn hàng cần xử lý", description: "3 đơn hàng đang chờ xác nhận", time: "5 phút trước", tone: "warning" },
    { icon: Package, title: "Kho sắp hết hàng", description: "Mặt hàng MacBook Pro còn 4 sản phẩm", time: "32 phút trước", tone: "warning" },
  ];

  return (
    <header className="h-16 bg-background/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <h1 className={cn(SECTION_TITLE, "truncate")}>
          {sectionTitles[activeSection]}
        </h1>
        <div className="hidden md:block"><DateRangePicker /></div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div
          className={cn(
            "relative flex items-center transition-all duration-300",
            searchFocused ? "w-64" : "w-48"
          )}
        >
          <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter" && query.trim()) onSearch(query.trim()); }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(FIELD_BASE, "pl-9 pr-4 transition-all duration-200")}
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            aria-label="Mở thông báo"
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((open) => !open)}
            className={cn(
              "relative w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200",
              notificationsOpen ? "bg-accent/15 text-accent" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full animate-pulse" />
          </button>
          {notificationsOpen && (
            <div className={cn(SURFACE_CARD, "absolute right-0 top-12 z-50 w-[360px] overflow-hidden shadow-2xl shadow-black/30")}>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Thông báo</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">Bạn có 2 thông báo chưa đọc</p>
                </div>
                <button aria-label="Đóng thông báo" onClick={() => setNotificationsOpen(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="divide-y divide-border/50">
                {notifications.map((notification) => {
                  const Icon = notification.icon;
                  return (
                    <button key={notification.title} className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60">
                      <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", TONE_SURFACE[notification.tone])}><Icon className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-foreground">{notification.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{notification.description}</span><span className="mt-1 block text-[11px] text-muted-foreground/70">{notification.time}</span></span>
                    </button>
                  );
                })}
              </div>
              <button onClick={onNotifications} className="w-full px-4 py-3 text-center text-xs font-medium text-accent hover:bg-accent/5">Xem tất cả thông báo</button>
            </div>
          )}
        </div>

        {/* Signed-in user menu */}
        <UserMenu onOpenAccounts={onOpenAccounts} />
      </div>
    </header>
  );
}
