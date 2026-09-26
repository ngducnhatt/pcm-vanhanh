"use client";

import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Order, OrderItem } from "@/lib/types";
import {
  ScanBarcode,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Barcode,
  Keyboard,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  chip,
  LABEL_BASE,
  SECTION_TITLE,
  SURFACE_CARD,
  TONE_SURFACE,
  TONE_TEXT,
  TONE_WASH,
} from "@/lib/ui";
import { HoDonForm } from "@/components/orders/hoadon-form";

interface ExportWarehouseModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenPrint: (order: Order) => void;
}

interface ExportItemRow {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  warranty_months: number;
  serial_number: string;
  isFilled: boolean;
}

export function ExportWarehouseModal({
  order,
  isOpen,
  onClose,
  onSuccess,
  onOpenPrint,
}: ExportWarehouseModalProps) {
  const [items, setItems] = useState<ExportItemRow[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (order && isOpen) {
      const rows: ExportItemRow[] = (order.items || []).map((item) => ({
        id: item.id,
        name: item.product?.name || "Linh kiện",
        sku: item.product?.sku || "",
        quantity: item.quantity,
        warranty_months: item.warranty_months ?? 36,
        serial_number: item.serial_number || "",
        isFilled: Boolean(item.serial_number?.trim()),
      }));
      setItems(rows);
      setNote("");
      setBarcodeInput("");

      // Find first empty item to focus
      const firstEmptyIndex = rows.findIndex((r) => !r.isFilled);
      setSelectedItemIndex(firstEmptyIndex >= 0 ? firstEmptyIndex : 0);

      // Focus barcode input after modal renders
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 200);
    }
  }, [order, isOpen]);

  if (!order) return null;

  // Process barcode input (Keyboard Wedge behavior)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const scanned = barcodeInput.trim();
    if (!scanned) return;

    processScannedCode(scanned);
    setBarcodeInput("");
  };

  const processScannedCode = (scanned: string) => {
    // Check if the barcode matches any SKU in the list
    const matchBySkuIndex = items.findIndex(
      (item) => item.sku.toLowerCase() === scanned.toLowerCase() && !item.isFilled
    );

    if (matchBySkuIndex >= 0) {
      setSelectedItemIndex(matchBySkuIndex);
      toast.info(`Đã nhận diện sản phẩm: ${items[matchBySkuIndex].name}. Vui lòng quét Serial Number.`);
      return;
    }

    // Otherwise, treat scanned code as serial number for the currently selected item
    if (selectedItemIndex >= 0 && selectedItemIndex < items.length) {
      const current = items[selectedItemIndex];
      const updated = [...items];
      updated[selectedItemIndex] = {
        ...current,
        serial_number: scanned,
        isFilled: true,
      };
      setItems(updated);
      toast.success(`Đã gán Serial "${scanned}" cho ${current.name}`);

      // Auto advance to next unfilled item
      const nextEmpty = updated.findIndex((r) => !r.isFilled);
      if (nextEmpty >= 0) {
        setSelectedItemIndex(nextEmpty);
      }
    }
  };

  // Simulation helpers for testing without hardware scanner
  const simulateScan = (sku: string, prefix: string) => {
    const randomSerial = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
    processScannedCode(randomSerial);
  };

  const autoGenerateAllSerials = () => {
    const updated = items.map((item, idx) => ({
      ...item,
      serial_number: item.serial_number || `${item.sku}-SN${Math.floor(100000 + Math.random() * 900000)}`,
      isFilled: true,
    }));
    setItems(updated);
    toast.success("Đã sinh tự động mã Serial cho tất cả linh kiện!");
  };

  const updateItemSerial = (index: number, val: string) => {
    const updated = [...items];
    updated[index].serial_number = val;
    updated[index].isFilled = val.trim().length > 0;
    setItems(updated);
  };

  const allItemsFilled = items.length > 0 && items.every((i) => i.isFilled);

  const handleSubmitExport = async () => {
    if (!allItemsFilled) {
      toast.error("Vui lòng quét hoặc nhập đầy đủ Serial Number cho tất cả linh kiện");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/orders/${order.id}/export-warehouse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.id,
            serial_number: i.serial_number.trim(),
          })),
          note,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Lỗi xuất kho đơn hàng");
      }

      toast.success(data.message || "Xuất kho thành công!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Lỗi xuất kho");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] max-w-7xl max-h-[94vh] flex flex-col p-3 sm:p-6 overflow-hidden bg-card">
        <DialogHeader className="pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className={cn("flex items-center gap-2", SECTION_TITLE)}>
              <ScanBarcode className="w-5 h-5 text-accent" />
              Màn hình xuất đơn kho: {order.invoice_no} ({order.customer_name})
            </DialogTitle>
            <button
              onClick={() => onOpenPrint({
                ...order,
                items: items.map((item) => {
                  const originalItem = order.items?.find((orderItem) => orderItem.id === item.id);
                  return {
                    ...item,
                    order_id: order.id,
                    product_id: originalItem?.product_id || "",
                    unit_price: originalItem?.unit_price || 0,
                    warranty_months: originalItem?.warranty_months ?? 36,
                    product: {
                      id: originalItem?.product_id || "",
                      name: item.name,
                      sku: item.sku,
                      unit_price: originalItem?.unit_price || 0,
                      stock_qty: 0,
                    },
                  };
                }),
              })}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-accent" /> In phiếu xuất kho
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
          <HoDonForm
            invoiceNo={order.invoice_no}
            invoiceDate={order.invoice_date}
            salesName={order.sales_user?.name || "Kinh doanh"}
            customerName={order.customer_name}
            customerPhone={order.customer_phone}
            customerAddress={order.customer_address}
            note={order.note}
            items={items.map((item) => {
              const orderItem = order.items?.find((candidate) => candidate.id === item.id);
              return {
                id: item.id,
                name: item.name,
                sku: item.sku,
                serial_number: item.serial_number || null,
                quantity: item.quantity,
                unit_price: orderItem?.unit_price || 0,
                warranty_months: item.warranty_months,
              };
            })}
            totalAmount={order.total_amount || 0}
            paidAmount={order.paid_amount || 0}
          />

          {/* Keyboard Wedge Barcode Scanner Area */}
          <div
            className={cn(
              TONE_WASH.accent,
              "p-3.5 rounded-xl space-y-2.5"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
                </span>
                <span className="text-xs font-bold text-accent flex items-center gap-1.5">
                  <Keyboard className="w-3.5 h-3.5" /> Chế độ nhận máy quét mã vạch (Keyboard Wedge Ready)
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Tự động focus — Quét bằng máy quét USB/Bluetooth hoặc gõ rồi Enter
              </span>
            </div>

            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Quét mã vạch linh kiện hoặc serial tại đây..."
                  className="w-full h-9 pl-9 pr-3 rounded-lg bg-background border border-accent/50 text-xs font-mono font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 cursor-pointer shrink-0"
              >
                Nhập mã
              </button>
            </form>

            {/* Quick Test Barcode Simulation Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                <Sparkles className={cn("w-3 h-3", TONE_TEXT.warning)} /> Mô phỏng quét nhanh:
              </span>
              {items.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => simulateScan(item.sku, item.sku.split("-")[0] || "SN")}
                  className="px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-[11px] font-mono text-foreground cursor-pointer"
                >
                  ⚡ Quét {item.sku}
                </button>
              ))}
              <button
                type="button"
                onClick={autoGenerateAllSerials}
                className="px-2.5 py-1 rounded-md bg-success/10 text-success hover:bg-success/20 text-[11px] font-medium ml-auto cursor-pointer"
              >
                ✨ Gán tự động tất cả
              </button>
            </div>
          </div>

          {/* Items & Serial assignment table */}
          <div className={cn(SURFACE_CARD, "overflow-hidden")}>
            <div className="p-3 bg-secondary/50 flex items-center justify-between text-xs font-semibold">
              <span>Danh sách linh kiện cần xuất & Gắn Serial ({items.filter(i => i.isFilled).length}/{items.length} xong)</span>
              <span className={cn(chip(allItemsFilled ? "success" : "warning"), "whitespace-nowrap")}>
                {allItemsFilled ? "✓ Đã đủ Serial" : "Chưa đủ Serial"}
              </span>
            </div>

            <div className="divide-y divide-border/50">
              {items.map((item, index) => {
                const isSelected = selectedItemIndex === index;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItemIndex(index)}
                    className={cn(
                      "p-3 flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors",
                      isSelected ? "bg-accent/10" : "hover:bg-secondary/30",
                      item.isFilled ? TONE_WASH.success : ""
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        {item.name}
                        {item.isFilled ? (
                          <span className={cn("inline-flex items-center justify-center rounded-md h-6 w-6 shrink-0", TONE_SURFACE.success)}>
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className={cn("inline-flex items-center justify-center rounded-md h-6 w-6 shrink-0", TONE_SURFACE.warning)}>
                            <AlertCircle className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Mã SKU: <span className="font-mono">{item.sku}</span> | Số lượng:{" "}
                        <strong className="text-foreground">{item.quantity}</strong>
                      </div>
                    </div>

                    <div className="w-64">
                      <label className={cn(LABEL_BASE, "block mb-0.5")}>
                        Mã vạch / Serial Number:
                      </label>
                      <input
                        type="text"
                        value={item.serial_number}
                        onChange={(e) => updateItemSerial(index, e.target.value)}
                        placeholder="VD: SN-998811..."
                        className={cn(
                          "w-full h-8 px-2.5 rounded bg-secondary/60 border border-transparent text-xs font-mono focus:outline-none focus:border-accent/60 focus:bg-secondary",
                          item.isFilled
                            ? "font-semibold bg-success/10"
                            : "border-transparent text-foreground focus:border-accent/60"
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={cn(LABEL_BASE, "block mb-1")}>
              Ghi chú xuất kho (Tình trạng tem, phụ kiện kèm theo...)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Đã dán tem bảo hành lên ốc, nguyên seal hộp phụ kiện..."
              className="w-full p-2.5 rounded-md bg-secondary/60 border border-transparent text-xs focus:outline-none focus:border-accent/60 focus:bg-secondary"
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
            disabled={!allItemsFilled || isSubmitting}
            onClick={handleSubmitExport}
            className="px-5 py-2 rounded-md text-xs font-semibold bg-accent text-accent-foreground hover:opacity-90 cursor-pointer disabled:opacity-40 shadow flex items-center gap-1.5"
          >
            {isSubmitting ? "Đang xuất kho..." : "Xác nhận xuất kho (Chuyển kho_done)"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
