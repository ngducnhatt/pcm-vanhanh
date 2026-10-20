"use client";

import Link from "next/link";
import { ArrowUpRight, Loader2, Package, Phone, Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Order } from "@/lib/types";
import { PAYMENT_STATUS_LABELS, STATUS_LABELS } from "@/lib/types";
import { chip, SECTION_SUBTITLE, SECTION_TITLE, SURFACE_CARD } from "@/lib/ui";
import { orderHref } from "@/components/orders/order-detail-page";

function formatMoney(value: number): string {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function formatDate(value: string): string {
  if (!value) return "—";
  return value.split("-").reverse().join("/");
}

/**
 * Trang kết quả tìm kiếm toàn cục.
 * Dùng chung API /api/orders (scope=all) để tìm theo:
 *  - mã hoá đơn: HD-001, hd001, HD 001, hoặc mã cũ
 *  - số điện thoại: có/không khoảng trắng, dấu chấm, gạch ngang
 *  - tên khách hàng
 * Không giới hạn theo bộ lọc ngày để tìm được đơn cũ.
 */
export function SearchResults({ query, onClose }: { query: string; onClose: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(query.trim()));
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const q = query.trim();

  useEffect(() => {
    if (!q) {
      setOrders([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetch(`/api/orders?scope=all&limit=50&search=${encodeURIComponent(q)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Không thể tìm kiếm đơn hàng");
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Không thể tìm kiếm đơn hàng");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [q, reloadKey]);

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  return (
    <div className="space-y-5">
      <div className={cn(SURFACE_CARD, "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between")}>
        <div>
          <p className={SECTION_SUBTITLE}>Kết quả tìm kiếm</p>
          <h2 className={SECTION_TITLE}>
            {q ? `Kết quả cho “${q}”` : "Tìm kiếm đơn hàng"}
          </h2>
          {q && !isLoading && !error && (
            <p className="mt-1 text-xs text-muted-foreground">
              {orders.length} đơn hàng · tìm trên toàn bộ thời gian
            </p>
          )}
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={onClose} className="self-start">
          <X className="h-4 w-4" />
          Đóng tìm kiếm
        </Button>
      </div>

      {!q ? (
        <div className={cn(SURFACE_CARD, "flex flex-col items-center justify-center border-dashed bg-card/50 px-6 py-14 text-center")}>
          <Search className="mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="font-medium text-foreground">Nhập mã hoá đơn hoặc số điện thoại</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Ví dụ: <span className="font-mono text-foreground">HD-001</span>,{" "}
            <span className="font-mono text-foreground">0901234567</span> hoặc tên khách hàng.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          Đang tìm đơn hàng...
        </div>
      ) : error ? (
        <div className={cn(SURFACE_CARD, "flex flex-col items-center gap-3 px-6 py-12 text-center")}>
          <p className="font-medium text-danger">{error}</p>
          <Button type="button" variant="secondary" size="sm" onClick={retry}>
            Thử lại
          </Button>
        </div>
      ) : orders.length === 0 ? (
        <div className={cn(SURFACE_CARD, "flex flex-col items-center justify-center border-dashed bg-card/50 px-6 py-14 text-center")}>
          <Search className="mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="font-medium text-foreground">Không tìm thấy đơn hàng phù hợp</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Kiểm tra lại mã hoá đơn (dạng HD-001) hoặc số điện thoại đã đặt hàng.
          </p>
        </div>
      ) : (
        <div className="grid gap-2.5">
          {orders.map((order) => {
            const status = STATUS_LABELS[order.status];
            const payment = PAYMENT_STATUS_LABELS[order.payment_status];
            return (
              <Link
                key={order.id}
                href={orderHref(order)}
                className={cn(
                  SURFACE_CARD,
                  "group flex items-center gap-4 p-4 text-left transition hover:bg-secondary/40"
                )}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Package className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-accent">{order.invoice_no}</span>
                    {status && <span className={chip(status.tone)}>{status.label}</span>}
                    {payment && <span className={chip(payment.tone)}>{payment.label}</span>}
                  </span>
                  <span className="mt-1 block truncate text-sm font-medium text-foreground">
                    {order.customer_name}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {order.customer_phone}
                    </span>
                    <span>Ngày {formatDate(order.invoice_date)}</span>
                    <span className="font-medium text-foreground">{formatMoney(order.total_amount)}</span>
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
