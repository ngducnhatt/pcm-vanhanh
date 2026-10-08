"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Link2, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import type { Order } from "@/lib/types";
import { PAYMENT_STATUS_LABELS, STATUS_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { chip, SURFACE_CARD } from "@/lib/ui";
import { OrderDetailTabs } from "@/components/orders/order-detail-tabs";

/** Link duy nhất của đơn hàng (nhân viên xem full, khách nhập SĐT). */
export function orderHref(order: { invoice_no: string }): string {
  return `/don-hang/${encodeURIComponent(order.invoice_no)}`;
}

export function copyOrderLink(invoiceNo: string) {
  const url = `${window.location.origin}/don-hang/${encodeURIComponent(invoiceNo)}`;
  const done = () => toast.success("Đã sao chép link đơn hàng");
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url).then(done).catch(() => toast.error("Không sao chép được link"));
  } else {
    window.prompt("Sao chép link đơn hàng:", url);
  }
}

/**
 * Trang chi tiết đơn hàng theo mã đơn (MPA: /don-hang/1, /don-hang/2, ...).
 * Giao diện tab y hệt modal nhân viên (dùng chung OrderDetailTabs).
 * Nhận thêm `initialOrder` để trang không cần fetch lại (khách đã xác thực SĐT).
 */
export function OrderDetailPage({ invoiceNo, initialOrder }: { invoiceNo: string; initialOrder?: Order | null }) {
  const code = decodeURIComponent(invoiceNo || "");
  const [order, setOrder] = useState<Order | null>(initialOrder ?? null);
  const [isLoading, setIsLoading] = useState(!initialOrder);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setNotFound(false);
    try {
      const lookup = await fetch(`/api/orders/by-invoice/${encodeURIComponent(code)}`, { cache: "no-store" });
      if (lookup.status === 404) {
        setNotFound(true);
        return;
      }
      if (!lookup.ok) throw new Error("lookup failed");
      const { id } = await lookup.json();
      const res = await fetch(`/api/orders/${id}`, { cache: "no-store" });
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("detail failed");
      const data = await res.json();
      setOrder(data.order);
    } catch {
      toast.error("Không tải được chi tiết đơn hàng");
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  useEffect(() => {
    if (initialOrder) return;
    load();
  }, [load, initialOrder]);

  const handleCopy = async () => {
    copyOrderLink(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-accent" /> Đang tải đơn hàng {code}...
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className={cn(SURFACE_CARD, "mx-auto max-w-lg p-8 text-center")}>
        <p className="mt-1 text-sm text-muted-foreground">Mã hóa đơn có thể sai hoặc đơn đã bị xóa.</p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">Không tìm thấy đơn hàng {code}</h2>
        <Link href="/don-hang" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
          <ArrowLeft className="h-4 w-4" /> Về Trung tâm đơn hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Header trang */}
      <div className={cn(SURFACE_CARD, "flex flex-wrap items-center justify-between gap-3 p-4")}>
        <div className="flex items-center gap-3">
          <Link href="/don-hang" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Về Trung tâm đơn hàng">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-mono text-lg font-bold text-foreground">{order.invoice_no}</h2>
              <span className={chip(STATUS_LABELS[order.status]?.tone ?? "neutral")}>
                {STATUS_LABELS[order.status]?.label || order.status}
              </span>
              <span className={chip(PAYMENT_STATUS_LABELS[order.payment_status]?.tone ?? "neutral")}>
                {PAYMENT_STATUS_LABELS[order.payment_status]?.label}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {order.customer_name} · {order.customer_phone} · Ngày {order.invoice_date}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/80"
            title="Sao chép link duy nhất của đơn này (gửi được cho khách, khách nhập SĐT để xem)"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Link2 className="h-3.5 w-3.5" />}
            {copied ? "Đã sao chép" : "Sao chép link"}
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/80"
          >
            <Printer className="h-3.5 w-3.5" /> In
          </button>
        </div>
      </div>

      {/* Nội dung y hệt modal nhân viên */}
      <div className={cn(SURFACE_CARD, "overflow-hidden px-4 pb-4")}>
        <OrderDetailTabs order={order} />
      </div>
    </div>
  );
}
