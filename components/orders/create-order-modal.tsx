"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/components/auth-context";
import { Product } from "@/lib/types";
import { Banknote, Plus, QrCode, Search, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HoDonForm, HoDonLine } from "@/components/orders/hoadon-form";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SelectedItem {
  product: Product;
  quantity: number;
  unit_price: number;
  warranty_months: number;
}

const money = (value: number) => `${value.toLocaleString("vi-VN")} đ`;

export function CreateOrderModal({ isOpen, onClose, onSuccess }: CreateOrderModalProps) {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"qr" | "cash" | "transfer">("qr");
  const [paymentType, setPaymentType] = useState<"unpaid" | "partial" | "full">("unpaid");
  const [depositAmount, setDepositAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let isCurrent = true;

    const loadProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const response = await fetch("/api/products");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Không thể tải danh mục sản phẩm");
        if (isCurrent) setProducts(data.products || []);
      } catch (error) {
        if (isCurrent) {
          toast.error(error instanceof Error ? error.message : "Không thể tải danh mục sản phẩm");
        }
      } finally {
        if (isCurrent) setIsLoadingProducts(false);
      }
    };

    void loadProducts();
    return () => {
      isCurrent = false;
    };
  }, [isOpen]);

  const filteredProducts = products
    .filter((product) =>
      `${product.name} ${product.sku}`.toLowerCase().includes(productSearch.toLowerCase())
    )
    .slice(0, 8);

  const totalAmount = selectedItems.reduce(
    (total, item) => total + item.unit_price * item.quantity,
    0
  );
  const paidAmount =
    paymentType === "full"
      ? totalAmount
      : paymentType === "partial"
        ? Math.max(0, Number(depositAmount) || 0)
        : 0;

  const toggleTag = (tag: string) => {
    setTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    );
  };

  const addItem = (product: Product) => {
    setSelectedItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...current,
        { product, quantity: 1, unit_price: product.unit_price, warranty_months: 36 },
      ];
    });
  };

  const updateItem = (productId: string, update: Partial<SelectedItem>) => {
    setSelectedItems((current) =>
      current.map((item) =>
        item.product.id === productId ? { ...item, ...update } : item
      )
    );
  };

  const handleSubmit = async (isDraft = false) => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Vui lòng điền tên và số điện thoại khách hàng");
      return;
    }
    if (!isDraft && selectedItems.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm vào hóa đơn");
      return;
    }
    if (paymentType === "partial" && (paidAmount <= 0 || paidAmount > totalAmount)) {
      toast.error("Số tiền đặt cọc phải lớn hơn 0 và không vượt quá tổng tiền hàng");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          customer_email: customerEmail,
          tags,
          note,
          items: selectedItems.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            warranty_months: item.warranty_months,
          })),
          initial_payment:
            paidAmount > 0 ? { method: paymentMethod, amount: paidAmount } : null,
          is_draft: isDraft,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Lỗi tạo đơn hàng");

      toast.success(data.message || "Tạo đơn hàng thành công!");
      onSuccess();
      onClose();
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setCustomerEmail("");
      setNote("");
      setSelectedItems([]);
      setTags([]);
      setPaymentType("unpaid");
      setDepositAmount(0);
      setProductSearch("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi tạo đơn hàng");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formItems: HoDonLine[] = selectedItems.map((item) => ({
    id: item.product.id,
    name: item.product.name,
    sku: item.product.sku,
    quantity: item.quantity,
    unit_price: item.unit_price,
    warranty_months: item.warranty_months,
  }));

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
                <span className="shrink-0 font-semibold">{money(product.unit_price)}</span>
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

  const invoiceDate = new Date().toLocaleDateString("en-CA");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[94dvh] w-[96vw] max-w-none flex-col gap-0 overflow-hidden border border-slate-300 bg-slate-100 p-0 sm:max-w-[min(96vw,1400px)]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Tạo hóa đơn đặt hàng</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          <HoDonForm
            isEditable
            invoiceNo=""
            invoiceDate={invoiceDate}
            salesName={currentUser?.name || ""}
            customerName={customerName}
            customerPhone={customerPhone}
            customerAddress={customerAddress}
            note={note}
            items={formItems}
            totalAmount={totalAmount}
            paidAmount={paidAmount}
            productPicker={productPicker}
            onCustomerNameChange={setCustomerName}
            onCustomerPhoneChange={setCustomerPhone}
            onCustomerAddressChange={setCustomerAddress}
            onNoteChange={setNote}
            onQuantityChange={(id, quantity) => updateItem(id, { quantity })}
            onWarrantyChange={(id, warranty_months) => updateItem(id, { warranty_months })}
            onRemoveItem={(id) =>
              setSelectedItems((current) =>
                current.filter((item) => item.product.id !== id)
              )
            }
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
                <Button
                  key={tag.id}
                  type="button"
                  variant={tags.includes(tag.id) ? "paper-primary" : "paper"}
                  size="xs"
                  onClick={() => toggleTag(tag.id)}
                  aria-pressed={tags.includes(tag.id)}
                  className={tags.includes(tag.id) ? "font-semibold" : undefined}
                >
                  {tag.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <strong>Thanh toán:</strong>
              {[
                { id: "unpaid", label: "Chưa thu" },
                { id: "partial", label: "Đặt cọc" },
                { id: "full", label: "Đã thu đủ" },
              ].map((type) => (
                <Button
                  key={type.id}
                  type="button"
                  variant={paymentType === type.id ? "paper-primary" : "paper"}
                  size="xs"
                  onClick={() => {
                    setPaymentType(type.id as typeof paymentType);
                    if (type.id === "full") setDepositAmount(totalAmount);
                    if (type.id === "unpaid") setDepositAmount(0);
                  }}
                  aria-pressed={paymentType === type.id}
                  className={paymentType === type.id ? "font-semibold" : undefined}
                >
                  {type.label}
                </Button>
              ))}
              {paymentType === "partial" && (
                <label className="flex items-center gap-1">
                  Đặt cọc:
                  <input
                    type="number"
                    min="1"
                    max={totalAmount}
                    value={depositAmount || ""}
                    onChange={(event) => setDepositAmount(Number(event.target.value) || 0)}
                    className="h-7 w-28 rounded border border-slate-300 px-2 text-right"
                  />
                </label>
              )}
              {paymentType !== "unpaid" && (
                <div className="flex gap-1">
                  {[
                    { id: "qr", label: "QR", icon: QrCode },
                    { id: "cash", label: "Tiền mặt", icon: Banknote },
                    { id: "transfer", label: "Chuyển khoản", icon: ShoppingCart },
                  ].map(({ id, label, icon: Icon }) => (
                    <Button
                      key={id}
                      type="button"
                      variant={paymentMethod === id ? "paper-primary" : "paper"}
                      size="xs"
                      onClick={() => setPaymentMethod(id as typeof paymentMethod)}
                      aria-pressed={paymentMethod === id}
                    >
                      <Icon className="h-3 w-3" />{label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <DialogFooter className="shrink-0 flex-row flex-wrap justify-between border-t border-slate-300 bg-white px-3 py-2 sm:px-5">
          <Button type="button" variant="paper" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="paper"
              size="sm"
              disabled={isSubmitting}
              onClick={() => void handleSubmit(true)}
            >
              Lưu nháp
            </Button>
            <Button
              type="button"
              variant="paper-primary"
              size="sm"
              disabled={isSubmitting}
              onClick={() => void handleSubmit(false)}
              className="font-semibold"
            >
              <ShoppingCart className="h-4 w-4" />
              {isSubmitting ? "Đang tạo..." : "Tạo đơn hàng"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
