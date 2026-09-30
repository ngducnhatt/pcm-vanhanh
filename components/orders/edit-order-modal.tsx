"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Order, Product } from "@/lib/types";
import { requiresRollbackToKho } from "@/lib/state-machine";
import { AlertTriangle, Edit3, Plus, Search, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { HoDonForm, HoDonLine } from "@/components/orders/hoadon-form";

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
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
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
      setIsLoadingProducts(true);
      const res = await fetch("/api/products");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải danh mục sản phẩm");
      setProducts(data.products || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải danh mục sản phẩm");
    } finally {
      setIsLoadingProducts(false);
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

  const formItems: HoDonLine[] = items.map((item) => ({
    id: item.product_id,
    name: item.name,
    sku: item.sku,
    serial_number: item.serial_number,
    quantity: item.quantity,
    unit_price: item.unit_price,
    warranty_months: item.warranty_months,
  }));

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

  const filteredProducts = products
    .filter((product) =>
      `${product.name} ${product.sku}`.toLowerCase().includes(productSearch.toLowerCase())
    )
    .slice(0, 8);

  const productPicker = (
    <div className="mt-3 space-y-2">
      <label className="relative block w-full sm:ml-auto sm:max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
        <input
          value={productSearch}
          onChange={(event) => setProductSearch(event.target.value)}
          placeholder="Tìm tên hoặc mã hàng để thêm vào hóa đơn"
          className="h-9 w-full rounded border border-slate-300 bg-white pl-9 pr-3 text-xs text-black outline-none focus:border-blue-600"
        />
      </label>
      {productSearch && (
        <div className="max-h-32 overflow-y-auto border border-slate-300 bg-white">
          {isLoadingProducts ? (
            <div className="p-3 text-xs text-slate-600">Đang tải sản phẩm...</div>
          ) : filteredProducts.length ? (
            filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => addItem(product)}
                className="flex w-full items-center justify-between gap-3 border-b border-slate-200 px-3 py-2 text-left text-xs text-black last:border-0 hover:bg-slate-50"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{product.name}</span>
                  <span className="text-[10px] text-slate-600">
                    {product.sku} · Tồn kho: {product.stock_qty}
                  </span>
                </span>
                <span className="shrink-0 font-semibold">
                  {product.unit_price.toLocaleString("vi-VN")} đ
                </span>
                <Plus className="h-4 w-4 shrink-0" />
              </button>
            ))
          ) : (
            <div className="p-3 text-xs text-slate-600">Không tìm thấy sản phẩm phù hợp.</div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[94dvh] w-[96vw] max-w-none flex-col gap-0 overflow-hidden border border-slate-300 bg-slate-100 p-0 sm:max-w-[min(96vw,1400px)]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>
            <Edit3 className="inline h-4 w-4" /> Chỉnh sửa hóa đơn {order.invoice_no}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          {isRollbackCandidate && (
            <div className="mx-auto mb-3 flex w-full max-w-5xl items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <strong className="text-amber-800">CẢNH BÁO QUY TRÌNH ROLLBACK:</strong>{" "}
                Đơn đang ở trạng thái <strong>{order.status}</strong>. Khi chỉnh sửa, đơn sẽ quay
                về kho chờ xuất để chuẩn bị lại; serial cũ vẫn được lưu trong lịch sử đối chiếu.
              </div>
            </div>
          )}

          <HoDonForm
            isEditable
            invoiceNo={order.invoice_no}
            invoiceDate={order.invoice_date}
            salesName={order.sales_user?.name || "Kinh doanh"}
            customerName={customerName}
            customerPhone={customerPhone}
            customerAddress={customerAddress}
            note={note}
            items={formItems}
            totalAmount={totalAmount}
            paidAmount={order.paid_amount || 0}
            productPicker={productPicker}
            onCustomerNameChange={setCustomerName}
            onCustomerPhoneChange={setCustomerPhone}
            onCustomerAddressChange={setCustomerAddress}
            onNoteChange={setNote}
            onQuantityChange={(id, quantity) => updateQuantity(id, quantity)}
            onWarrantyChange={(id, warranty_months) =>
              setItems((current) =>
                current.map((item) =>
                  item.product_id === id ? { ...item, warranty_months } : item
                )
              )
            }
            onRemoveItem={removeItem}
          />

          <section className="mx-auto mt-3 grid w-full max-w-5xl gap-3 rounded-md border border-slate-300 bg-white p-3 text-xs text-black md:grid-cols-2">
            <label className="flex items-center gap-2 md:col-span-2">
              <strong className="shrink-0">Email khách hàng (không bắt buộc):</strong>
              <input
                type="email"
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                maxLength={160}
                className="min-w-0 flex-1 border-b border-dotted border-slate-400 bg-transparent px-1 py-1 outline-none focus:border-blue-600"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <strong>Quy trình:</strong>
              {[
                { id: "kithuat", label: "Kỹ thuật" },
                { id: "baohanh", label: "Bảo hành" },
                { id: "ship", label: "Ship" },
                { id: "thu_cu", label: "Thu cũ đổi mới" },
              ].map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  aria-pressed={tags.includes(tag.id)}
                  className={`rounded border px-2 py-1 ${
                    tags.includes(tag.id)
                      ? "border-blue-700 bg-blue-50 font-semibold"
                      : "border-slate-300"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1">
              <strong>
                Lý do chỉnh sửa (ghi vào lịch sử đối chiếu)
              </strong>
              <input
                type="text"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="VD: Khách đổi linh kiện hoặc cập nhật thông tin..."
                className="h-8 rounded border border-slate-300 px-2 outline-none focus:border-blue-600"
              />
            </label>
          </section>
        </div>

        <DialogFooter className="shrink-0 flex-row flex-wrap justify-between border-t border-slate-300 bg-white px-3 py-2 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="flex items-center gap-2 rounded bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            <ShoppingCart className="h-4 w-4" />
            {isSubmitting
              ? "Đang lưu..."
              : isRollbackCandidate
                ? "Lưu thay đổi & chuyển lại Kho"
                : "Lưu thay đổi"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
