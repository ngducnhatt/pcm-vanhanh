"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Product } from "@/lib/types";
import {
  SECTION_SUBTITLE,
  SECTION_TITLE,
  chip,
  type Tone,
} from "@/lib/ui";
import { Filter, PackagePlus, RefreshCw, Search, Tag } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { can } from "@/lib/permissions";

const CATEGORIES = [
  "CPU",
  "Mainboard",
  "RAM",
  "SSD",
  "HDD",
  "GPU",
  "PSU",
  "Case",
  "Tản nhiệt",
  "Màn hình",
  "Phím chuột",
  "Tai nghe",
  "Khác",
];

interface FormState {
  sku: string;
  name: string;
  unit_price: string;
  stock_qty: string;
  category: string;
}

const emptyForm: FormState = {
  sku: "",
  name: "",
  unit_price: "",
  stock_qty: "0",
  category: "",
};

export function PipelineSection() {
  const { currentUser } = useAuth();
  const canImport = can(currentUser?.roles, "product:manage");

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Không thể tải danh sách sản phẩm");
      }
      setProducts(data.products || []);
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Không thể tải danh sách sản phẩm");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category || "Chưa phân loại"))],
    [products]
  );
  const visibleProducts = products.filter((product) => {
    const category = product.category || "Chưa phân loại";
    const matchesCategory = activeCategory === "all" || category === activeCategory;
    const matchesSearch = `${product.sku} ${product.name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!form.sku.trim()) {
      setFormError("Vui lòng nhập mã sản phẩm");
      return;
    }
    if (!form.name.trim()) {
      setFormError("Vui lòng nhập tên sản phẩm");
      return;
    }
    const price = Number(form.unit_price);
    if (isNaN(price) || price < 0) {
      setFormError("Giá phải là số lớn hơn hoặc bằng 0");
      return;
    }
    const qty = Number(form.stock_qty);
    if (isNaN(qty) || qty < 0 || !Number.isInteger(qty)) {
      setFormError("Số lượng phải là số nguyên lớn hơn hoặc bằng 0");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: form.sku.trim(),
          name: form.name.trim(),
          unit_price: price,
          stock_qty: qty,
          category: form.category || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Không thể tạo sản phẩm");
        return;
      }

      toast.success(`Đã nhập sản phẩm "${form.name}" vào kho`);
      setForm(emptyForm);
      setShowForm(false);
      await loadProducts();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Không thể tạo sản phẩm");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className={SECTION_SUBTITLE}>Danh sách linh kiện và thiết bị trong kho</p>
          <h1 className={SECTION_TITLE}>Kho hàng</h1>
        </div>
        <div className="flex items-center gap-2">
          {canImport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(!showForm)}
            >
              <PackagePlus className="h-4 w-4" />
              {showForm ? "Đóng form" : "Nhập sản phẩm"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={loadProducts} disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Làm mới
          </Button>
        </div>
      </div>

      {/* Form nhập sản phẩm - chỉ hiển thị cho Kho và Admin */}
      {canImport && showForm && (
        <Card className="border-0 bg-card">
          <CardContent className="p-4">
            <h2 className="mb-4 font-semibold text-foreground">Thêm sản phẩm mới</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="product-sku" className="text-xs">Mã sản phẩm (SKU) *</Label>
                  <Input
                    id="product-sku"
                    value={form.sku}
                    onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))}
                    className="bg-secondary"
                    placeholder="VD: CPU-I5-12400F"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="product-name" className="text-xs">Tên sản phẩm *</Label>
                  <Input
                    id="product-name"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="bg-secondary"
                    placeholder="VD: Intel Core i5-12400F"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="product-category" className="text-xs">Nhóm sản phẩm</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="bg-secondary">
                      <SelectValue placeholder="Chọn nhóm" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="product-price" className="text-xs">Giá bán (VNĐ) *</Label>
                  <Input
                    id="product-price"
                    type="number"
                    min="0"
                    value={form.unit_price}
                    onChange={(event) => setForm((prev) => ({ ...prev, unit_price: event.target.value }))}
                    className="bg-secondary"
                    placeholder="VD: 2500000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="product-qty" className="text-xs">Số lượng nhập *</Label>
                  <Input
                    id="product-qty"
                    type="number"
                    min="0"
                    value={form.stock_qty}
                    onChange={(event) => setForm((prev) => ({ ...prev, stock_qty: event.target.value }))}
                    className="bg-secondary"
                    placeholder="VD: 10"
                  />
                </div>
              </div>

              {formError && (
                <div className="rounded-lg bg-danger/10 px-3 py-2.5 text-xs text-danger">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setForm(emptyForm);
                    setShowForm(false);
                  }}
                >
                  Huỷ
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <PackagePlus className="h-4 w-4" />
                  )}
                  Nhập sản phẩm
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 bg-card">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm theo mã hoặc tên sản phẩm..."
                className="border-border bg-secondary pl-9"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              {visibleProducts.length} sản phẩm
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pt-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setActiveCategory("all")}
              className={
                activeCategory === "all"
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              }
            >
              Tất cả
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                size="sm"
                variant="ghost"
                onClick={() => setActiveCategory(category)}
                className={
                  activeCategory === category
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                }
              >
                {category}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h2 className="font-semibold text-foreground">Danh sách sản phẩm</h2>
            <p className={SECTION_SUBTITLE}>Chọn nhóm phía trên để lọc nhanh</p>
          </div>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Sản phẩm</th>
                <th className="px-4 py-3 font-medium">Nhóm</th>
                <th className="px-4 py-3 font-medium">Mã sản phẩm</th>
                <th className="px-4 py-3 font-medium">Serial</th>
                <th className="px-4 py-3 font-medium">Số lượng</th>
                <th className="px-4 py-3 font-medium">Vị trí</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {visibleProducts.map((product) => {
                const category = product.category || "Chưa phân loại";
                const status = product.stock_qty > 0 ? "Sẵn sàng" : "Hết hàng";
                const tone: Tone = product.stock_qty > 0 ? "success" : "danger";
                return (
                  <tr key={product.id} className="transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium text-foreground">{product.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{category}</td>
                    <td className="px-4 py-3 font-mono text-xs text-accent">{product.sku}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">Chưa cập nhật</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{product.stock_qty}</td>
                    <td className="px-4 py-3 text-muted-foreground">Chưa cập nhật</td>
                    <td className="px-4 py-3">
                      <span className={chip(tone)}>{status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {isLoading && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Đang tải danh sách sản phẩm...
          </div>
        )}
        {!isLoading && loadError && (
          <div className="p-10 text-center text-sm text-destructive">{loadError}</div>
        )}
        {!isLoading && !loadError && visibleProducts.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {products.length ? "Không tìm thấy sản phẩm phù hợp." : "Kho chưa có sản phẩm nào."}
          </div>
        )}
      </Card>
    </div>
  );
}
