"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Order, Product } from "@/lib/types";
import { requiresRollbackToKho } from "@/lib/state-machine";
import { Plus, Trash2, Search, AlertTriangle, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  chip,
  FIELD_BASE,
  LABEL_BASE,
  SECTION_TITLE,
  SURFACE_CARD,
  TONE_WASH,
} from "@/lib/ui";

interface EditOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface EditableItem {
  id?: string;
  product_id: string;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  warranty_months: number;
  serial_number?: string | null;
}

export function EditOrderModal({ order, isOpen, onClose, onSuccess }: EditOrderModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order && isOpen) {
      setCustomerName(order.customer_name);
      setCustomerPhone(order.customer_phone);
      setCustomerAddress(order.customer_address || "");
      setCustomerEmail(order.customer_email || "");
      setNote(order.note || "");
      setTags(order.tags || []);
      setReason("");

      if (order.items) {
        setItems(
          order.items.map((i) => ({
            id: i.id,
            product_id: i.product_id,
            sku: i.product?.sku || "",
            name: i.product?.name || "Linh kiện",
            quantity: i.quantity,
            unit_price: i.unit_price,
            warranty_months: i.warranty_months ?? 36,
            serial_number: i.serial_number,
          }))
        );
      }
      fetchProducts();
    }
  }, [order, isOpen]);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch {
      // ignore
    }
  };

  if (!order) return null;

  const isRollbackCandidate = requiresRollbackToKho(order.status);

  const totalAmount = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const addItem = (product: Product) => {
    const existing = items.find((i) => i.product_id === product.id);
    if (existing) {
      setItems(
        items.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setItems([
        ...items,
        {
          product_id: product.id,
          sku: product.sku,
          name: product.name,
          quantity: 1,
          unit_price: product.unit_price,
          warranty_months: 36,
        },
      ]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(items.filter((i) => i.product_id !== productId));
    } else {
      setItems(
        items.map((i) => (i.product_id === productId ? { ...i, quantity } : i))
      );
    }
  };

  const removeItem = (productId: string) => {
    setItems(items.filter((i) => i.product_id !== productId));
  };

  const handleSubmit = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Vui lòng điền tên và số điện thoại");
      return;
    }

    if (items.length === 0) {
      toast.error("Đơn hàng phải có ít nhất 1 linh kiện");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          customer_email: customerEmail,
          tags,
          note,
          items: items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            unit_price: i.unit_price,
            warranty_months: i.warranty_months,
            serial_number: i.serial_number,
          })),
          reason: reason.trim() || "Điều chỉnh đơn hàng",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Lỗi cập nhật đơn hàng");
      }

      toast.success(data.message || "Cập nhật đơn hàng thành công!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật đơn hàng");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-6 overflow-hidden bg-card">
        <DialogHeader className="pb-3">
          <DialogTitle className={cn("flex items-center gap-2", SECTION_TITLE)}>
            <Edit3 className="w-5 h-5 text-accent" />
            Sửa đơn hàng: {order.invoice_no} ({order.customer_name})
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-4 pr-1">
          {/* Rollback Warning Alert */}
          {isRollbackCandidate && (
            <div
              className={cn(
                TONE_WASH.warning,
                "p-3.5 rounded-lg text-foreground text-xs flex gap-3 items-start animate-pulse"
              )}
            >
              <AlertTriangle className="w-5 h-5 shrink-0 text-warning mt-0.5" />
              <div>
                <span className="font-bold text-warning">
                  CẢNH BÁO QUY TRÌNH ROLLBACK:
                </span>{" "}
                Đơn hàng hiện đang ở trạng thái{" "}
                <span className="font-mono font-semibold px-1 rounded bg-warning/20">
                  {order.status}
                </span>{" "}
                (đã qua khâu xuất kho). Nếu bạn điều chỉnh số lượng hoặc thêm/bớt linh kiện,
                hệ thống sẽ <strong>tự động chuyển trạng thái đơn quay về &quot;kho_pending&quot;</strong> để
                kho chuẩn bị và gán lại linh kiện. Toàn bộ serial cũ sẽ được lưu trong lịch sử để đối
                chiếu thu hồi!
              </div>
            </div>
          )}

          {/* Customer info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className={cn(LABEL_BASE, "block mb-1")}>
                Tên khách hàng
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={FIELD_BASE}
              />
            </div>
            <div>
              <label className={cn(LABEL_BASE, "block mb-1")}>Địa chỉ khách hàng</label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className={FIELD_BASE}
              />
            </div>
            <div>
              <label className={cn(LABEL_BASE, "block mb-1")}>
                Số điện thoại
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className={FIELD_BASE}
              />
            </div>
            <div>
              <label className={cn(LABEL_BASE, "block mb-1")}>
                Email
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className={FIELD_BASE}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className={cn(LABEL_BASE, "block mb-1.5")}>
              Tags quy trình
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "moi", label: "Hàng mới" },
                { id: "kithuat", label: "🔧 Có yêu cầu Kỹ Thuật" },
                { id: "baohanh", label: "🛡️ Có yêu cầu Bảo Hành" },
                { id: "thu_cu", label: "Thu cũ đổi mới" },
              ].map((t) => {
                const isSelected = tags.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className={cn(
                      chip(isSelected ? "accent" : "neutral"),
                      "cursor-pointer transition-colors",
                      !isSelected && "hover:text-foreground"
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add product list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className={cn(LABEL_BASE, "font-semibold")}>
                Thêm linh kiện mới vào đơn
              </label>
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Tìm linh kiện..."
                  className="w-full h-8 pl-8 pr-3 rounded bg-secondary/60 border border-transparent text-xs focus:outline-none focus:border-accent/60 focus:bg-secondary"
                />
              </div>
            </div>

            <div className={cn(SURFACE_CARD, "grid grid-cols-1 md:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1")}>
              {products
                .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                .slice(0, 6)
                .map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addItem(product)}
                    className="flex items-center justify-between p-2 rounded-md bg-secondary/40 hover:bg-secondary text-xs cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-medium text-foreground truncate">{product.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {product.unit_price.toLocaleString()}đ (Kho: {product.stock_qty})
                      </div>
                    </div>
                    <button
                      type="button"
                      className="p-1 rounded bg-accent/15 text-accent hover:bg-accent/25"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
            </div>

            {/* Current items table */}
            <div className={cn(SURFACE_CARD, "divide-y divide-border/50 overflow-hidden")}>
              {items.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center justify-between p-2.5 text-xs"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="font-medium text-foreground">{item.name}</div>
                    <div className="text-muted-foreground text-[11px]">
                      SKU: {item.sku} | {item.unit_price.toLocaleString()}đ
                      {item.serial_number && (
                        <span className="ml-2 font-mono text-warning">
                          (Serial: {item.serial_number})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-lg bg-secondary/60">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center hover:bg-card text-foreground"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center hover:bg-card text-foreground"
                      >
                        +
                      </button>
                    </div>
                    <label className="flex items-center gap-1 whitespace-nowrap text-muted-foreground">
                      BH
                      <input
                        type="number"
                        min="0"
                        value={item.warranty_months}
                        onChange={(event) => {
                          const warrantyMonths = Math.max(0, Number(event.target.value) || 0);
                          setItems(items.map((current) =>
                            current.product_id === item.product_id
                              ? { ...current, warranty_months: warrantyMonths }
                              : current
                          ));
                        }}
                        className="h-7 w-16 rounded border border-border bg-background px-1 text-center text-xs text-foreground"
                        aria-label={`Thời hạn bảo hành ${item.name} theo tháng`}
                      />
                      tháng
                    </label>
                    <span className="w-24 text-right font-semibold text-accent">
                      {(item.unit_price * item.quantity).toLocaleString()}đ
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.product_id)}
                      className="text-muted-foreground hover:text-danger p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center p-3 bg-secondary/40 font-bold text-sm">
                <span>Tổng tiền hàng mới:</span>
                <span className="text-accent text-base">{totalAmount.toLocaleString()}đ</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className={cn(LABEL_BASE, "block mb-1")}>
              Lý do chỉnh sửa đơn hàng (sẽ ghi vào lịch sử đối chiếu) <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Khách đổi sang card RTX 4070 Super, thêm 1 thanh RAM..."
              className={FIELD_BASE}
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
            className="px-4 py-2 rounded-md text-xs font-semibold bg-accent text-accent-foreground hover:opacity-90 cursor-pointer disabled:opacity-50 shadow"
          >
            {isSubmitting
              ? "Đang lưu..."
              : isRollbackCandidate
              ? "Lưu thay đổi & Rollback về Kho (kho_pending)"
              : "Lưu thay đổi"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
