"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Order, User } from "@/lib/types";
import { Truck, MapPin, Calculator, UserCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  chip,
  LABEL_BASE,
  SECTION_TITLE,
  SURFACE_CARD,
  TONE_TEXT,
} from "@/lib/ui";

interface AssignShipmentModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignShipmentModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: AssignShipmentModalProps) {
  const [shippers, setShippers] = useState<User[]>([]);
  const [selectedShipperId, setSelectedShipperId] = useState("");
  const [address, setAddress] = useState("");
  const [distanceKm, setDistanceKm] = useState<number | string>("");
  const [kmSource, setKmSource] = useState<"gg_map" | "manual">("gg_map");
  const [note, setNote] = useState("");
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order && isOpen) {
      setAddress(order.shipment?.address || "Toà nhà Bitexco, 2 Hải Triều, Bến Nghé, Quận 1, TP. Hồ Chí Minh");
      setDistanceKm(order.shipment?.distance_km || "");
      setSelectedShipperId(order.shipment?.shipper_id || "");
      setKmSource(order.shipment?.km_source || "gg_map");
      setNote("");
      fetchShippers();
    }
  }, [order, isOpen]);

  const fetchShippers = async () => {
    try {
      const res = await fetch("/api/users?role=shipper");
      if (res.ok) {
        const data = await res.json();
        const list = data.users || [];
        setShippers(list);
        if (list.length > 0 && !selectedShipperId) {
          setSelectedShipperId(list[0].id);
        }
      }
    } catch {
      toast.error("Không thể tải danh sách shipper");
    }
  };

  const calculateDistance = async () => {
    if (!address.trim()) {
      toast.error("Vui lòng nhập địa chỉ giao hàng");
      return;
    }

    try {
      setIsCalculatingDistance(true);
      const res = await fetch("/api/shipping/distance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: address }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể tính khoảng cách");
      }

      setDistanceKm(data.distance_km);
      setKmSource("gg_map");
      toast.success(
        `Đã tính toán: ${data.distance_km} km (${data.duration_text || "khoảng thời gian di chuyển"})`
      );
    } catch (err: any) {
      toast.error(err.message || "Lỗi tính khoảng cách");
    } finally {
      setIsCalculatingDistance(false);
    }
  };

  if (!order) return null;

  const handleSubmit = async () => {
    if (!selectedShipperId) {
      toast.error("Vui lòng chọn nhân viên shipper");
      return;
    }

    if (!address.trim()) {
      toast.error("Vui lòng nhập địa chỉ giao hàng");
      return;
    }

    const distNum = Number(distanceKm);
    if (isNaN(distNum) || distNum <= 0) {
      toast.error("Khoảng cách (km) không hợp lệ");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/orders/${order.id}/shipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipper_id: selectedShipperId,
          address: address.trim(),
          distance_km: distNum,
          km_source: kmSource,
          note: note.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Lỗi phân công vận chuyển");
      }

      toast.success(data.message || "Đã phân công shipper thành công!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Lỗi phân công vận chuyển");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-6 overflow-hidden bg-card">
        <DialogHeader className="pb-3">
          <DialogTitle className={cn("flex items-center gap-2", SECTION_TITLE)}>
            <Truck className="w-5 h-5 text-accent" />
            Phân công shipper cho đơn: {order.invoice_no}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1 text-xs">
          {/* Order Customer Summary */}
          <div className={cn(SURFACE_CARD, "p-3")}>
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold text-foreground text-sm">
                  {order.customer_name}
                </span>{" "}
                <span className="text-muted-foreground font-mono">({order.customer_phone})</span>
              </div>
              <span className="font-bold text-accent">
                {order.total_amount.toLocaleString()}đ
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              COD cần thu:{" "}
              <strong className={cn("font-bold", TONE_TEXT.warning)}>
                {Math.max(0, order.total_amount - order.paid_amount).toLocaleString()}đ
              </strong>{" "}
              ({order.payment_status === "full" ? "Đã thanh toán đủ" : "Chưa thu đủ"})
            </div>
          </div>

          {/* Select Shipper */}
          <div>
            <label className={cn(LABEL_BASE, "block mb-1.5 flex items-center gap-1")}>
              <UserCheck className="w-3.5 h-3.5 text-accent" /> Chọn nhân viên giao hàng (Shipper)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {shippers.map((s) => {
                const isSelected = selectedShipperId === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedShipperId(s.id)}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between",
                      isSelected
                        ? "bg-accent/15 text-accent font-semibold"
                        : "bg-secondary/50 text-foreground hover:bg-secondary"
                    )}
                  >
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground">{s.phone}</div>
                    </div>
                    {isSelected && <span className="text-accent font-bold">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <label className={cn(LABEL_BASE, "block mb-1 flex items-center gap-1")}>
              <MapPin className="w-3.5 h-3.5 text-accent" /> Địa chỉ giao hàng
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Nhập địa chỉ giao hàng chi tiết..."
              className="w-full p-2 rounded-md bg-secondary/60 border border-transparent text-xs focus:outline-none focus:border-accent/60 focus:bg-secondary"
            />
          </div>

          {/* Distance Calculation with Google Maps + Manual Override */}
          <div className={cn(SURFACE_CARD, "p-3 space-y-2.5")}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-accent" /> Tính quãng đường vận chuyển
              </span>
              <button
                type="button"
                disabled={isCalculatingDistance}
                onClick={calculateDistance}
                className="px-3 py-1 rounded-md bg-accent/20 hover:bg-accent/30 text-accent font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50 text-[11px]"
              >
                {isCalculatingDistance ? "Đang tính..." : "⚡ Tính km Google Maps"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={cn(LABEL_BASE, "block mb-1")}>
                  Khoảng cách (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={distanceKm}
                  onChange={(e) => {
                    setDistanceKm(e.target.value);
                    setKmSource("manual"); // auto switch to manual when user types
                  }}
                  placeholder="VD: 5.5"
                  className="w-full h-8 px-2.5 rounded bg-secondary/60 border border-transparent text-xs font-mono font-bold text-accent focus:border-accent/60 focus:bg-secondary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className={cn(LABEL_BASE, "block mb-1")}>
                  Nguồn tính km
                </label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setKmSource("gg_map")}
                    className={cn(
                      chip(kmSource === "gg_map" ? "accent" : "neutral"),
                      "justify-center cursor-pointer transition-colors",
                      kmSource === "gg_map" && "font-semibold"
                    )}
                  >
                    Google Maps
                  </button>
                  <button
                    type="button"
                    onClick={() => setKmSource("manual")}
                    className={cn(
                      chip(kmSource === "manual" ? "accent" : "neutral"),
                      "justify-center cursor-pointer transition-colors",
                      kmSource === "manual" && "font-semibold"
                    )}
                  >
                    Nhập tay
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Note */}
          <div>
            <label className={cn(LABEL_BASE, "block mb-1")}>
              Ghi chú cho Shipper
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Gọi trước khi giao 15p, cẩn thận hàng linh kiện dễ vỡ..."
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
            Đóng
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="px-5 py-2 rounded-md text-xs font-semibold bg-accent text-accent-foreground hover:opacity-90 cursor-pointer disabled:opacity-50 shadow"
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận phân công (Chuyển ship_assigned)"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
