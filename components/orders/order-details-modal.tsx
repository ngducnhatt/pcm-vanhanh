"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Order, STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/types";
import {
  FileText,
  Phone,
  CreditCard,
  Truck,
  History,
  Package,
  CheckCircle2,
  Clock,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { chip } from "@/lib/ui";
import { HoDonForm, orderToHoDonLines } from "@/components/orders/hoadon-form";

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
  const [activeTab, setActiveTab] = useState<"items" | "history" | "payments" | "shipment">("items");

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

            {onOpenPrint && order && (
              <button
                onClick={() => onOpenPrint(order)}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-accent" /> In hóa đơn
              </button>
            )}
          </div>
        </DialogHeader>

        {isLoading || !order ? (
          <div className="py-20 text-center text-muted-foreground text-sm">
            Đang tải dữ liệu chi tiết đơn hàng...
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="flex text-xs font-medium">
              {[
                { id: "items", label: `Hóa đơn đặt hàng (${order.items?.length || 0})`, icon: Package },
                { id: "history", label: `Lịch sử trạng thái (${order.history?.length || 0})`, icon: History },
                { id: "payments", label: `Thanh toán (${order.payments?.length || 0})`, icon: CreditCard },
                { id: "shipment", label: "Vận chuyển & Giao hàng", icon: Truck },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "px-4 py-2.5 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer",
                      isActive
                        ? "border-accent text-accent font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto py-3">
              {/* Tab: Items */}
              {activeTab === "items" && (
                <HoDonForm
                  invoiceNo={order.invoice_no}
                  invoiceDate={order.invoice_date}
                  salesName={order.sales_user?.name || "Kinh doanh"}
                  customerName={order.customer_name}
                  customerPhone={order.customer_phone}
                  customerAddress={order.customer_address}
                  note={order.note}
                  items={orderToHoDonLines(order)}
                  totalAmount={order.total_amount}
                  paidAmount={order.paid_amount}
                />
              )}

              {/* Tab: History */}
              {activeTab === "history" && (
                <div className="space-y-3">
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {order.history?.map((h) => {
                      const isRollback = h.snapshot_serials != null;
                      let snapshotList: any[] = [];
                      if (isRollback) {
                        try {
                          snapshotList = JSON.parse(h.snapshot_serials || "[]");
                        } catch {
                          snapshotList = [];
                        }
                      }

                      return (
                        <div key={h.id} className="relative group">
                          <div
                            className={cn(
                              "absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 bg-background",
                              isRollback
                                ? "bg-warning"
                                : "border-accent bg-accent"
                            )}
                          />
                          <div className="p-3 rounded-lg bg-secondary/50 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={chip(STATUS_LABELS[h.status]?.tone ?? "neutral")}>
                                  {STATUS_LABELS[h.status]?.label || h.status}
                                </span>
                                {isRollback && (
                                  <span className={cn(chip('warning'), "gap-1")}>
                                    <RotateCcw className="w-2.5 h-2.5" /> Rollback Kho
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground">
                                {new Date(h.created_at).toLocaleString("vi-VN")}
                              </span>
                            </div>

                            <div className="text-foreground">{h.note}</div>

                            <div className="text-[11px] text-muted-foreground">
                              Người thực hiện: <strong>{h.changed_by_user?.name || "Hệ thống"}</strong> ({h.changed_by_user?.role})
                            </div>

                            {/* Snapshot serial display */}
                            {isRollback && snapshotList.length > 0 && (
                              <div className="mt-2 p-2.5 rounded bg-warning/10 text-warning text-[11px] space-y-1">
                                <div className="font-semibold text-warning flex items-center gap-1">
                                  <RotateCcw className="w-3 h-3" /> Snapshot Serial cũ trước khi sửa đơn:
                                </div>
                                <div className="divide-y divide-warning/20">
                                  {snapshotList.map((snap, idx) => (
                                    <div key={idx} className="py-1 flex justify-between">
                                      <span>{snap.name} (x{snap.quantity})</span>
                                      <span className="font-mono text-warning">
                                        Serial: {snap.serial_number || "Chưa gán"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab: Payments */}
              {activeTab === "payments" && (
                <div className="space-y-3 text-xs">
                  {order.payments && order.payments.length > 0 ? (
                    <div className="rounded-lg overflow-hidden bg-secondary/30">
                      <table className="w-full text-left">
                        <thead className="bg-secondary/50 text-muted-foreground">
                          <tr>
                            <th className="p-2.5">Thời gian</th>
                            <th className="p-2.5">Phương thức</th>
                            <th className="p-2.5 text-right">Số tiền thu</th>
                            <th className="p-2.5">Người thu tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {order.payments.map((p) => (
                            <tr key={p.id}>
                              <td className="p-2.5 text-muted-foreground">
                                {new Date(p.paid_at).toLocaleString("vi-VN")}
                              </td>
                              <td className="p-2.5 font-medium">
                                {p.method === "qr"
                                  ? "Mã QR"
                                  : p.method === "cash"
                                  ? "Tiền mặt"
                                  : "Chuyển khoản"}
                              </td>
                              <td className="p-2.5 text-right font-bold text-accent">
                                {p.amount.toLocaleString()}đ
                              </td>
                              <td className="p-2.5 text-muted-foreground">
                                {p.collected_by_user?.name || "Nhân viên"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Chưa có khoản thanh toán nào được ghi nhận cho đơn hàng này.
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Shipment */}
              {activeTab === "shipment" && (
                <div className="space-y-3 text-xs">
                  {order.shipment ? (
                    <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
                      <div className="flex items-center justify-between pb-2.5">
                        <span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-accent" /> Phân công giao hàng
                        </span>
                        <span className="rounded-md px-2 py-1 text-[11px] font-medium bg-warning/15 text-warning">
                          {order.shipment.km_source === "gg_map" ? "Google Maps Distance" : "Khoảng cách nhập tay"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-muted-foreground">Nhân viên Shipper:</div>
                          <div className="font-semibold text-foreground text-sm mt-0.5">
                            {order.shipment.shipper?.name || "Chưa phân công"}
                          </div>
                          {order.shipment.shipper?.phone && (
                            <div className="text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {order.shipment.shipper.phone}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="text-muted-foreground">Khoảng cách giao hàng:</div>
                          <div className="font-bold text-accent text-base mt-0.5">
                            {order.shipment.distance_km} km
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-muted-foreground">Địa chỉ giao hàng:</div>
                        <div className="p-2 rounded bg-secondary text-foreground font-medium mt-1">
                          {order.shipment.address}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Đơn hàng chưa có thông tin phân công vận chuyển.
                    </div>
                  )}
                </div>
              )}
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
