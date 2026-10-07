"use client";

import { cn } from "@/lib/utils";
import { FIELD_BASE, SECTION_TITLE, SURFACE_CARD } from "@/lib/ui";
import type { Section } from "@/app/page";
import { Bell, Search, Package, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DateRangePicker, type DatePreset, type DateRange } from "@/components/dashboard/date-range-picker";
import { UserMenu } from "@/components/user-menu";

interface HeaderProps {
  activeSection: Section;
  onSearch: (query: string) => void;
  onNotifications: () => void;
  onOpenAccounts?: () => void;
  datePreset: DatePreset;
  dateRange: DateRange;
  onDateRangeChange: (preset: DatePreset, range: DateRange) => void;
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

export function Header({ activeSection, onSearch, onNotifications, onOpenAccounts, datePreset, dateRange, onDateRangeChange }: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifs, setNotifs] = useState<{ id: string; order_id: string | null; title: string; message: string | null; invoice_no: string | null; created_at: string; is_read: number }[]>([]);
  const [unread, setUnread] = useState(0);

  const loadNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=6", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setNotifs(data.items || []);
      setUnread(Number(data.unread || 0));
    } catch {
      /* im lặng khi rớt mạng */
    }
  }, []);

  useEffect(() => {
    loadNotifs();
    const timer = setInterval(loadNotifs, 30000);
    return () => clearInterval(timer);
  }, [loadNotifs]);

  const markAllRead = async () => {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => null);
    setUnread(0);
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
  };

  /** Bấm thông báo: tự đánh dấu đã đọc + nhảy tới trang đơn hàng đó */
  const openNotifOrder = async (n: { id: string; order_id: string | null; is_read: number }) => {
    setNotificationsOpen(false);
    if (n.is_read === 0) {
      setUnread((u) => Math.max(0, u - 1));
      setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: 1 } : x)));
      fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [n.id] }),
      }).catch(() => null);
    }
    if (n.order_id) {
      try {
        localStorage.setItem("pcm_open_order", n.order_id);
      } catch {
        /* bỏ qua */
      }
      window.dispatchEvent(new CustomEvent("pcm:open-order", { detail: { orderId: n.order_id } }));
    }
  };

  const formatTime = (value: string) => {
    const d = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
  };

  return (
    <header className="h-16 bg-background/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <h1 className={cn(SECTION_TITLE, "truncate")}>
          {sectionTitles[activeSection]}
        </h1>
        <div className="hidden md:block"><DateRangePicker preset={datePreset} range={dateRange} onChange={onDateRangeChange} /></div>
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
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>
          {notificationsOpen && (
            <div className={cn(SURFACE_CARD, "absolute right-0 top-12 z-50 w-[360px] overflow-hidden shadow-2xl shadow-black/30")}>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Thông báo</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {unread > 0 ? `Bạn có ${unread} thông báo chưa đọc` : "Không có thông báo mới"}
                  </p>
                </div>
                <button aria-label="Đóng thông báo" onClick={() => setNotificationsOpen(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="divide-y divide-border/50">
                {notifs.length === 0 && (
                  <p className="px-4 py-6 text-center text-xs text-muted-foreground">Chưa có thông báo nào</p>
                )}
                {notifs.map((n) => (
                  <button key={n.id} onClick={() => openNotifOrder(n)} className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent"><Package className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">{n.title}</span>
                      {n.message && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{n.message}</span>}
                      <span className="mt-1 block text-[11px] text-muted-foreground/70">
                        {n.invoice_no ? `${n.invoice_no} · ` : ''}{formatTime(n.created_at)}
                      </span>
                    </span>
                    {n.is_read === 0 && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                  </button>
                ))}
              </div>
              <div className="flex">
                {unread > 0 && (
                  <button onClick={markAllRead} className="flex-1 px-4 py-3 text-center text-xs font-medium text-muted-foreground hover:bg-secondary/60">Đánh dấu đã đọc</button>
                )}
                <button onClick={onNotifications} className="flex-1 px-4 py-3 text-center text-xs font-medium text-accent hover:bg-accent/5">Xem tất cả thông báo</button>
              </div>
            </div>
          )}
        </div>

        {/* Signed-in user menu */}
        <UserMenu onOpenAccounts={onOpenAccounts} />
      </div>
    </header>
  );
}
