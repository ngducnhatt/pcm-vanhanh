"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SURFACE_CARD, TONE_SURFACE, SECTION_TITLE, SECTION_SUBTITLE, chip } from "@/lib/ui";

interface Notif {
  id: string;
  order_id: string | null;
  invoice_no: string | null;
  kind: string;
  title: string;
  message: string | null;
  is_read: number;
  created_at: string;
}

function formatTime(value: string): string {
  const d = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

function groupOf(value: string): string {
  const d = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return "Hôm nay";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Hôm qua";
  return "Cũ hơn";
}

export function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=50", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setItems(data.items || []);
        setUnread(Number(data.unread || 0));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markAllRead = async () => {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => null);
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    toast.success("Đã đánh dấu tất cả đã đọc");
  };

  /** Bấm thông báo: tự đánh dấu đã đọc + nhảy tới route đơn hàng (MPA) */
  const openOrder = async (n: Notif) => {
    if (n.is_read === 0) {
      setUnread((u) => Math.max(0, u - 1));
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: 1 } : x)));
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
      router.push("/don-hang");
    }
  };

  return (
    <div className="space-y-6">
      <div className={cn(SURFACE_CARD, "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between")}>
        <div>
          <div className="flex items-center gap-2">
            <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", TONE_SURFACE.accent)}>
              <Bell className="h-5 w-5" />
            </span>
            <h2 className={SECTION_TITLE}>Tất cả thông báo</h2>
          </div>
          <p className={SECTION_SUBTITLE}>Thông báo tag theo đơn hàng bạn phụ trách.</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="rounded-lg bg-secondary/30 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/10">
            Đánh dấu đã đọc ({unread})
          </button>
        )}
      </div>

      <div className={cn(SURFACE_CARD, "p-5")}>
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            Thông báo gần đây {unread > 0 && <span className={cn("ml-1", chip("accent"))}>{unread} mới</span>}
          </p>
        </div>
        {isLoading ? (
          <p className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
          </p>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-xs text-muted-foreground">
            Chưa có thông báo nào. Khi đơn hàng bạn tạo/phụ trách có thay đổi, thông báo sẽ hiện ở đây.
          </p>
        ) : (
          <div className="space-y-5">
            {items.map((n, index) => (
              <div key={n.id} className="relative">
                {(index === 0 || groupOf(items[index - 1].created_at) !== groupOf(n.created_at)) && (
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {groupOf(n.created_at)}
                  </p>
                )}
                <button key={n.id} onClick={() => openOrder(n)} className={cn("flex w-full gap-4 rounded-xl p-3 text-left transition hover:bg-secondary/60", n.is_read === 0 && "bg-accent/[0.04]")}>
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", TONE_SURFACE.accent)}>
                    <Package className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-foreground">{n.title}</p>
                      {n.is_read === 0 && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                    </div>
                    {n.message && <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>}
                    <p className="mt-2 text-xs text-muted-foreground/70">
                      {n.invoice_no ? `${n.invoice_no} · ` : ""}{formatTime(n.created_at)}
                    </p>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
