"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Order, PaymentMethod } from "@/lib/types";
import { DollarSign, QrCode, Banknote, CreditCard, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  FIELD_BASE,
  LABEL_BASE,
  SECTION_TITLE,
  SURFACE_CARD,
  TONE_TEXT,
  TONE_WASH,
} from "@/lib/ui";

interface CollectPaymentModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CollectPaymentModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: CollectPaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("qr");
  const [amount, setAmount] = useState<number | string>("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!order) return null;

  const total = order.total_amount || 0;
  const paid = order.paid_amount || 0;
  const remaining = Math.max(0, total - paid);

  // Set default amount to remaining on open
  const handleOpenPreset = (val: number) => {
    setAmount(val);
  };

  const currentAmountNum = Number(amount) || 0;
  const willComplete =
    order.status === "ship_done" && currentAmountNum >= remaining && remaining > 0;

  const handleSubmit = async () => {
    if (currentAmountNum <= 0) {
      toast.error("Vui lòng nhập số tiền thu hợp lệ");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/orders/${order.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          amount: currentAmountNum,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Lỗi ghi nhận thanh toán");
      }

      toast.success(data.message || "Đã thu tiền thành công!");
      if (data.isAutoCompleted) {
        toast.success("🎉 Đơn hàng đã giao xong và thanh toán đủ -> Tự động hoàn tất (completed)!");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Lỗi thu tiền");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md flex flex-col p-6 overflow-hidden bg-card">
        <DialogHeader className="pb-3">
          <DialogTitle className={cn("flex items-center gap-2", SECTION_TITLE)}>
            <DollarSign className="w-5 h-5 text-accent" />
            Thu tiền đơn hàng: {order.invoice_no}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3 text-xs">
          {/* Amount Balance Overview */}
          <div className={cn(SURFACE_CARD, "p-3 space-y-1.5")}>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Tổng tiền đơn hàng:</span>
              <span className="font-semibold text-foreground">{total.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Đã thanh toán trước đó:</span>
              <span className={cn("font-semibold", TONE_TEXT.success)}>{paid.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold pt-1">
              <span className="text-foreground">Số tiền còn thiếu:</span>
              <span className={cn("text-base", TONE_TEXT.warning)}>{remaining.toLocaleString()}đ</span>
            </div>
          </div>

          {/* Quick amount presets */}
          <div>
            <label className={cn(LABEL_BASE, "block mb-1.5")}>
              Chọn nhanh số tiền cần thu:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleOpenPreset(remaining)}
                className="py-1.5 px-2 rounded bg-secondary hover:bg-secondary/80 text-foreground font-medium text-center cursor-pointer"
              >
                Thu hết: {remaining.toLocaleString()}đ
              </button>
              <button
                type="button"
                onClick={() => handleOpenPreset(Math.round(remaining / 2))}
                className="py-1.5 px-2 rounded bg-secondary hover:bg-secondary/80 text-foreground font-medium text-center cursor-pointer"
              >
                Thu 50%: {Math.round(remaining / 2).toLocaleString()}đ
              </button>
            </div>
          </div>

          {/* Custom Amount input */}
          <div>
            <label className={cn(LABEL_BASE, "block mb-1")}>
              Số tiền thu thực tế (VNĐ) <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="VD: 5000000"
              className={cn(FIELD_BASE, "font-bold font-mono", TONE_TEXT.accent)}
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className={cn(LABEL_BASE, "block mb-1.5")}>
              Phương thức nhận tiền:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "qr", label: "Mã QR", icon: QrCode },
                { id: "cash", label: "Tiền mặt", icon: Banknote },
                { id: "transfer", label: "Chuyển khoản", icon: CreditCard },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id as any)}
                    className={cn(
                      "p-2 rounded-lg text-center flex flex-col items-center gap-1 cursor-pointer transition-colors",
                      isSelected
                        ? "bg-accent/15 text-accent font-bold"
                        : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px]">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* If QR selected, show simulated QR box */}
          {method === "qr" && currentAmountNum > 0 && (
            <div className={cn(SURFACE_CARD, "p-3 text-center space-y-1.5")}>
              <div className="text-[11px] font-bold text-foreground">MÃ VIETQR THANH TOÁN TỰ ĐỘNG</div>
              <div className="w-36 h-36 mx-auto bg-secondary rounded-lg flex flex-col items-center justify-center p-2">
                <QrCode className="w-24 h-24 text-foreground" />
                <span className="text-[9px] font-mono text-muted-foreground mt-1">TechZone - Vietcombank</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                Nội dung CK: <strong className="font-mono">{order.invoice_no}</strong> | Số tiền:{" "}
                <strong className="text-foreground font-bold">{currentAmountNum.toLocaleString()}đ</strong>
              </div>
            </div>
          )}

          {/* Auto completion notification */}
          {willComplete && (
            <div
              className={cn(
                TONE_WASH.success,
                "p-2.5 rounded bg-success/10 text-foreground text-[11px] flex items-center gap-2"
              )}
            >
              <CheckCircle2 className={cn("w-4 h-4 shrink-0", TONE_TEXT.success)} />
              <span>
                Đơn hàng đã được giao xong. Thu đủ 100% số tiền này sẽ <strong>tự động hoàn tất đơn (completed)</strong>!
              </span>
            </div>
          )}

          {/* Note */}
          <div>
            <label className={cn(LABEL_BASE, "block mb-1")}>
              Ghi chú thu tiền
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Khách chuyển khoản Vietcombank, đã nhận thông báo tiền về..."
              className="w-full h-8 px-2.5 rounded bg-secondary/60 border border-transparent text-xs focus:outline-none focus:border-accent/60 focus:bg-secondary"
            />
          </div>
        </div>

        <DialogFooter className="pt-3 flex items-center justify-between sm:justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-xs font-medium text-muted-foreground hover:bg-secondary cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isSubmitting || currentAmountNum <= 0}
            onClick={handleSubmit}
            className="px-5 py-2 rounded-md text-xs font-semibold bg-accent text-accent-foreground hover:opacity-90 cursor-pointer disabled:opacity-50 shadow"
          >
            {isSubmitting ? "Đang xử lý..." : `Xác nhận đã thu ${currentAmountNum.toLocaleString()}đ`}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
