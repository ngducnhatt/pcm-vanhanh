"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Order, STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/types";
import {
  FileText,
  Link2,
  ExternalLink,
} from "lucide-react";
import { chip } from "@/lib/ui";
import { copyOrderLink, orderHref } from "@/components/orders/order-detail-page";
import { OrderDetailTabs } from "@/components/orders/order-detail-tabs";

interface OrderDetailsModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPrint?: (order: Order) => void;
}

export function OrderDetailsModal({
  orderId,
  isOpen,
  onClose,
  onOpenPrint,
}: OrderDetailsModalProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (orderId && isOpen) {
      fetchOrderDetails(orderId);
    }
  }, [orderId, isOpen]);

  const fetchOrderDetails = async (id: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
    } catch (err) {
      console.error("Failed to load order details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !orderId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] max-w-7xl max-h-[94vh] flex flex-col p-3 sm:p-6 overflow-hidden bg-card sm:max-w-[min(96vw,1400px)]">
        {/* Header luôn render (ke ca luc dang tai) de DialogContent luon co
            DialogTitle - yeu cau bat buoc cua Radix de ho tro doc man hinh. */}
        <DialogHeader className="shrink-0 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-accent" />
              <div>
                <DialogTitle className="text-base font-bold flex flex-wrap items-center gap-2">
                  <span>Xem hóa đơn đặt hàng</span>
                  {order && (
                    <span className={chip(STATUS_LABELS[order.status]?.tone ?? "neutral")}>
                      {STATUS_LABELS[order.status]?.label || order.status}
                    </span>
                  )}
                  {order && (
                    <span
                      className={chip(PAYMENT_STATUS_LABELS[order.payment_status]?.tone ?? "neutral")}
                    >
                      {PAYMENT_STATUS_LABELS[order.payment_status]?.label}
                    </span>
                  )}
                </DialogTitle>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onOpenPrint && order && (
                <button
                  onClick={() => onOpenPrint(order)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-accent" /> In hóa đơn
                </button>
              )}
              {order && (
                <>
                  <button
                    onClick={() => copyOrderLink(order.invoice_no)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground flex items-center gap-1.5 cursor-pointer"
                    title={`Sao chép link duy nhất của đơn (gửi được cho khách): /don-hang/${order.invoice_no}`}
                  >
                    <Link2 className="w-3.5 h-3.5" /> Sao chép link
                  </button>
                  <Link
                    href={orderHref(order)}
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground flex items-center gap-1.5"
                    title="Mở trang riêng của đơn này"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Trang riêng
                  </Link>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        {isLoading || !order ? (
          <div className="py-20 text-center text-muted-foreground text-sm">
            Đang tải dữ liệu chi tiết đơn hàng...
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <OrderDetailTabs order={order} />
            </div>

            <DialogFooter className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground cursor-pointer"
              >
                Đóng
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
