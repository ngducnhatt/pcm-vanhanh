"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-context";
import { SURFACE_CARD, SECTION_TITLE, SECTION_SUBTITLE, CHIP_BASE, ROLE_META, roleChip } from "@/lib/ui";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  order_id: string;
  invoice_no: string | null;
  status: string;
  note: string | null;
  created_at: string;
  actor: { id: string; name: string; username: string | null; roles: Role[] } | null;
}

function formatTime(value: string): string {
  const d = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

export function OverviewSection({ dateRange }: { dateRange?: { from: string; to: string } | null }) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.roles?.includes("admin") || false;

  const [items, setItems] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isMore, setIsMore] = useState(false);

  const load = useCallback(
    async (reset = true) => {
      if (reset) setIsLoading(true);
      else setIsMore(true);
      try {
        const params = new URLSearchParams();
        if (roleFilter !== "all") params.append("role", roleFilter);
        if (dateRange?.from && dateRange?.to) {
          params.append("from", dateRange.from);
          params.append("to", dateRange.to);
        }
        params.append("limit", "50");
        params.append("offset", reset ? "0" : String(items.length));
        const res = await fetch(`/api/admin/activity?${params.toString()}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data.error || "Không tải được hoạt động");
          return;
        }
        setItems((prev) => (reset ? data.items || [] : [...prev, ...(data.items || [])]));
        setTotal(Number(data.total || 0));
      } finally {
        setIsLoading(false);
        setIsMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roleFilter, dateRange?.from, dateRange?.to]
  );

  useEffect(() => {
    if (isAdmin) load(true);
    else setIsLoading(false);
  }, [isAdmin, load]);

  if (!isAdmin && !isLoading) {
    return (
      <div className={cn(SURFACE_CARD, "p-10 text-center")}>
        <Activity className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium text-foreground">Khu vực chỉ dành cho Admin</p>
        <p className="mt-1 text-xs text-muted-foreground">Nhật ký hoạt động vận hành chỉ Admin mới xem được.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={SECTION_TITLE}>Hoạt động vận hành</h2>
          <p className={SECTION_SUBTITLE}>
            {total > 0 ? `${total} hoạt động` : "Mọi thao tác trên đơn hàng theo thời gian thực"} · chỉ Admin xem được
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/70 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Làm mới
        </button>
      </div>

      {/* Lọc theo vai trò */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setRoleFilter("all")}
          className={cn(
            CHIP_BASE,
            roleFilter === "all" ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
          )}
        >
          Tất cả
        </button>
        {(Object.keys(ROLE_META) as Role[]).map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(roleFilter === role ? "all" : role)}
            className={cn(roleChip(role), roleFilter === role && "ring-2 ring-current")}
          >
            {ROLE_META[role].short}
          </button>
        ))}
      </div>

      {/* Danh sách hoạt động */}
      <div className={cn(SURFACE_CARD, "divide-y divide-border/50")}>
        {isLoading && items.length === 0 && (
          <p className="flex items-center justify-center gap-2 px-4 py-10 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải hoạt động...
          </p>
        )}
        {!isLoading && items.length === 0 && (
          <p className="px-4 py-10 text-center text-xs text-muted-foreground">Chưa có hoạt động nào</p>
        )}
        {items.map((item) => {
          const primaryRole = item.actor?.roles?.[0];
          return (
            <div key={item.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2.5">
              {primaryRole && primaryRole in ROLE_META ? (
                <span className={roleChip(primaryRole)}>
                  {ROLE_META[primaryRole].short.toUpperCase()}
                </span>
              ) : (
                <span className={cn(CHIP_BASE, "bg-secondary text-muted-foreground")}>HỆ THỐNG</span>
              )}
              <span className="font-mono text-xs font-medium text-foreground">
                {item.actor?.username || item.actor?.name || "hệ thống"}
              </span>
              <span className="min-w-0 flex-1 text-xs text-muted-foreground">{item.note || item.status}</span>
              {item.invoice_no && (
                <span className="font-mono text-[11px] font-medium text-foreground">{item.invoice_no}</span>
              )}
              <span className="shrink-0 text-[10px] text-muted-foreground">{formatTime(item.created_at)}</span>
            </div>
          );
        })}
      </div>

      {items.length < total && (
        <div className="text-center">
          <button
            onClick={() => load(false)}
            disabled={isMore}
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary/70 disabled:opacity-50"
          >
            {isMore && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Xem thêm ({items.length}/{total})
          </button>
        </div>
      )}
    </div>
  );
}
