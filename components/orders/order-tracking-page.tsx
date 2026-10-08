"use client";

import { useCallback, useEffect, useState } from "react";
import { Cpu, Loader2, Lock, Phone } from "lucide-react";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FIELD_BASE, LABEL_BASE, SURFACE_CARD } from "@/lib/ui";
import { OrderDetailPage } from "@/components/orders/order-detail-page";

/**
 * Trang duy nhất của mỗi đơn hàng: /don-hang/1, /don-hang/2, ...
 * - Nhân viên đã đăng nhập: xem toàn bộ chi tiết ngay, không cần nhập gì.
 * - Khách chưa đăng nhập: nhập đúng SĐT đặt hàng → xem ĐẦY ĐỦ giao diện
 *   giống hệt nhân viên (4 tabs Hóa đơn / Lịch sử / Thanh toán / Vận chuyển).
 */
export function OrderTrackingPage({ invoiceNo }: { invoiceNo: string }) {
  const code = decodeURIComponent(invoiceNo || "");
  const [mode, setMode] = useState<"checking" | "staff" | "guest">("checking");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedOrder, setVerifiedOrder] = useState<Order | null>(null);

  // Có phiên nhân viên? -> xem full, khỏi nhập SĐT
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => setMode(res.ok ? "staff" : "guest"))
      .catch(() => setMode("guest"));
  }, []);

  const submit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!phone.trim() || isSubmitting) return;
      setIsSubmitting(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/orders/track/${encodeURIComponent(code)}?phone=${encodeURIComponent(phone.trim())}`,
          { cache: "no-store" }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "Không tra cứu được đơn hàng");
        } else if (data.order) {
          setVerifiedOrder(data.order);
        } else {
          setError("Vui lòng nhập số điện thoại đặt hàng");
        }
      } catch {
        setError("Lỗi kết nối, vui lòng thử lại");
      } finally {
        setIsSubmitting(false);
      }
    },
    [code, phone, isSubmitting]
  );

  if (mode === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  // Nhân viên (hoặc khách đã xác thực SĐT): giao diện đầy đủ y hệt modal
  const view = (banner: React.ReactNode) => (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      {banner}
      <OrderDetailPage invoiceNo={invoiceNo} initialOrder={verifiedOrder} />
    </div>
  );

  if (mode === "staff") {
    return view(
      <div className="mx-auto mb-4 max-w-5xl rounded-lg bg-accent/10 px-4 py-2 text-center text-xs text-accent">
        Bạn đang xem với quyền nhân viên. Gửi link trên thanh địa chỉ cho khách — khách mở link chỉ cần nhập SĐT là xem được đầy đủ như bạn.
      </div>
    );
  }

  if (verifiedOrder) {
    return view(
      <div className="mx-auto mb-4 max-w-5xl rounded-lg bg-success/10 px-4 py-2 text-center text-xs text-success">
        Đã xác thực số điện thoại — bạn đang xem đầy đủ thông tin đơn hàng {code}.
      </div>
    );
  }

  // Khách chưa xác thực: form nhập SĐT
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Cpu className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-xl font-semibold text-foreground">Đơn hàng PCM</h1>
          <p className="mt-1 font-mono text-sm font-bold text-accent">{code}</p>
        </div>

        <form onSubmit={submit} className={cn(SURFACE_CARD, "space-y-4 p-6")}>
          <div className="flex items-start gap-2 rounded-lg bg-secondary/60 px-3 py-2.5 text-xs text-muted-foreground">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Để bảo mật, vui lòng nhập <strong>đúng số điện thoại</strong> đã đặt đơn hàng này. Sau khi xác thực bạn sẽ xem được đầy đủ giống nhân viên.
            </span>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="track-phone" className={LABEL_BASE}>
              Số điện thoại đặt hàng
            </label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="track-phone"
                inputMode="tel"
                autoComplete="tel"
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="vd: 0901234567"
                className={cn(FIELD_BASE, "h-11 pl-9")}
              />
            </div>
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2.5 text-xs text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !phone.trim()}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Đang xác thực..." : "Xem đơn hàng của tôi"}
          </button>
        </form>
      </div>
    </div>
  );
}
