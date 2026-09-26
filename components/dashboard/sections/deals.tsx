"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  FIELD_BASE,
  SURFACE_CARD,
  TONE_SURFACE,
  TONE_TEXT,
  chip,
  type Tone,
} from "@/lib/ui";
import {
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  XCircle,
  MoreHorizontal,
  ChevronDown,
  Plus,
  X,
} from "lucide-react";

type OrderStatus =
  | "new"
  | "paid"
  | "waiting-stock"
  | "shipped"
  | "waiting-tech"
  | "tech-completed"
  | "waiting-warranty"
  | "warranty-completed"
  | "waiting-delivery-assignment"
  | "delivering"
  | "delivered"
  | "completed"
  | "cancelled";

interface Deal {
  id: string;
  company: string;
  contact: string;
  email: string;
  value: number;
  stage: string;
  status: OrderStatus;
  closeDate: string;
  rep: string;
}

const deals: Deal[] = [
  { id: "1", company: "Acme Corporation", contact: "John Smith", email: "john@acme.com", value: 125000, stage: "Negotiation", status: "paid", closeDate: "2024-01-15", rep: "Sarah Chen" },
  { id: "2", company: "TechStart Inc", contact: "Lisa Wong", email: "lisa@techstart.io", value: 89500, stage: "Proposal", status: "waiting-stock", closeDate: "2024-01-22", rep: "Mike Johnson" },
  { id: "3", company: "GlobalFin Partners", contact: "Robert Davis", email: "rdavis@globalfin.com", value: 245000, stage: "Qualified", status: "waiting-stock", closeDate: "2024-02-01", rep: "Emily Davis" },
  { id: "4", company: "DataSync Solutions", contact: "Emma Wilson", email: "emma@datasync.net", value: 67800, stage: "Lead", status: "cancelled", closeDate: "2024-01-10", rep: "James Wilson" },
  { id: "5", company: "CloudBase Ltd", contact: "Michael Chen", email: "m.chen@cloudbase.io", value: 178000, stage: "Negotiation", status: "paid", closeDate: "2024-01-18", rep: "Sarah Chen" },
  { id: "6", company: "Innovate Labs", contact: "Jennifer Park", email: "jpark@innovate.co", value: 156000, stage: "Proposal", status: "waiting-stock", closeDate: "2024-01-28", rep: "Lisa Park" },
  { id: "7", company: "NextGen Systems", contact: "David Lee", email: "david@nextgen.tech", value: 203000, stage: "Qualified", status: "waiting-stock", closeDate: "2024-02-05", rep: "Mike Johnson" },
  { id: "8", company: "Prime Analytics", contact: "Sarah Johnson", email: "sj@primeanalytics.com", value: 94500, stage: "Lead", status: "waiting-stock", closeDate: "2024-02-10", rep: "Emily Davis" },
];

const statusConfig: Record<OrderStatus, { icon: typeof CheckCircle2; tone: Tone; label: string }> = {
  new: { icon: Clock, tone: "warning", label: "Đơn mới" },
  paid: { icon: CheckCircle2, tone: "success", label: "Đã thanh toán" },
  "waiting-stock": { icon: Clock, tone: "warning", label: "Chờ xuất kho" },
  shipped: { icon: CheckCircle2, tone: "success", label: "Đã xuất kho" },
  "waiting-tech": { icon: Clock, tone: "warning", label: "Chờ kỹ thuật" },
  "tech-completed": { icon: CheckCircle2, tone: "success", label: "Kỹ thuật hoàn thành" },
  "waiting-warranty": { icon: Clock, tone: "warning", label: "Chờ bảo hành" },
  "warranty-completed": { icon: CheckCircle2, tone: "success", label: "Bảo hành hoàn thành" },
  "waiting-delivery-assignment": { icon: Clock, tone: "warning", label: "Chờ phân công ship" },
  delivering: { icon: Clock, tone: "warning", label: "Đang giao" },
  delivered: { icon: CheckCircle2, tone: "success", label: "Đã giao" },
  completed: { icon: CheckCircle2, tone: "accent", label: "Hoàn tất" },
  cancelled: { icon: XCircle, tone: "danger", label: "Đã hủy" },
};

const orderLogs = [
  { department: "Kinh doanh", entries: ["19:00 nhatnd đã tạo đơn", "19:00 khách đã cọc 1.000.000đ"] },
  { department: "Kho", entries: ["19:10 nghinv đã xuất kho"] },
  { department: "Kỹ thuật", entries: ["19:20 nhatnd đã nhận đơn", "20:00 nhatnd đã hoàn thành"] },
  { department: "Vận chuyển", entries: ["21:00 huynv đã giao đơn cho hoangnv", "21:30 hoangnv đang giao hàng", "22:00 hoangnv đã giao", "22:00 hoangnv đã nhận 10.000.000đ tiền mặt và 2.000.000đ chuyển khoản"] },
  { department: "Kế toán", entries: ["23:00 anth đã xác nhận"] },
];

const productCatalog = [
  { name: "CPU Intel Core i5 14400F 4.7Ghz 20MB", price: 4590000, warranty: "36 tháng" },
  { name: "MAINBOARD SSTC B760M-HDV-D5 DDR5", price: 2590000, warranty: "36 tháng" },
  { name: "Ram AGI 16GB BUS 5600Mhz DDR5", price: 5490000, warranty: "36 tháng" },
  { name: "VGA Colorful GeForce RTX 5070 Ti NB Battle AX", price: 36990000, warranty: "36 tháng" },
  { name: "Màn hình Gaming ASUS TUF Gaming VG259QM5A", price: 2990000, warranty: "36 tháng" },
];

export function DealsSection({ mode = "sale" }: { mode?: "sale" | "warehouse" | "technical" | "warranty" | "shipping" | "accounting" }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [cancelDeal, setCancelDeal] = useState<Deal | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Array<(typeof productCatalog)[number] & { quantity: number }>>([]);
  const filteredProducts = productCatalog.filter((product) => product.name.toLowerCase().includes(productSearch.toLowerCase()));
  const invoiceTotal = selectedProducts.reduce((total, product) => total + product.price * product.quantity, 0);
  const addProduct = (product: (typeof productCatalog)[number]) => {
    setSelectedProducts((current) => current.some((item) => item.name === product.name)
      ? current.map((item) => item.name === product.name ? { ...item, quantity: item.quantity + 1 } : item)
      : [...current, { ...product, quantity: 1 }]);
    setProductSearch("");
  };

  const orderNav = mode === "warehouse"
    ? [
        { id: "all", label: "Tất cả", statuses: [] as OrderStatus[] },
        { id: "waiting-stock", label: "Chờ kho xuất", statuses: ["waiting-stock"] as OrderStatus[] },
        { id: "shipped", label: "Kho đã xuất", statuses: ["shipped"] as OrderStatus[] },
      ]
    : mode === "technical"
      ? [
          { id: "all", label: "Tất cả", statuses: [] as OrderStatus[] },
          { id: "waiting-tech", label: "Chờ kỹ thuật", statuses: ["waiting-tech"] as OrderStatus[] },
          { id: "tech-completed", label: "Kỹ thuật hoàn thành", statuses: ["tech-completed"] as OrderStatus[] },
        ]
      : mode === "warranty"
        ? [
            { id: "all", label: "Tất cả", statuses: [] as OrderStatus[] },
            { id: "waiting-warranty", label: "Chờ bảo hành", statuses: ["waiting-warranty"] as OrderStatus[] },
            { id: "warranty-completed", label: "Bảo hành hoàn thành", statuses: ["warranty-completed"] as OrderStatus[] },
          ]
        : mode === "shipping"
          ? [
              { id: "all", label: "Tất cả", statuses: [] as OrderStatus[] },
              { id: "waiting-delivery-assignment", label: "Chờ phân công ship", statuses: ["waiting-delivery-assignment"] as OrderStatus[] },
              { id: "delivering", label: "Đang giao", statuses: ["delivering"] as OrderStatus[] },
              { id: "delivered", label: "Đã giao", statuses: ["delivered"] as OrderStatus[] },
            ]
          : mode === "accounting"
            ? [
                { id: "all", label: "Tất cả", statuses: [] as OrderStatus[] },
                { id: "paid", label: "Đã thanh toán", statuses: ["paid"] as OrderStatus[] },
                { id: "completed", label: "Hoàn tất", statuses: ["completed"] as OrderStatus[] },
                { id: "cancelled", label: "Đã hủy", statuses: ["cancelled"] as OrderStatus[] },
              ]
            : [
        { id: "all", label: "Tất cả", statuses: [] as OrderStatus[] },
        { id: "deposited", label: "Đã cọc", statuses: ["paid"] as OrderStatus[] },
        { id: "undeposited", label: "Chưa cọc", statuses: ["new", "waiting-stock"] as OrderStatus[] },
        { id: "collected", label: "Đã thu tiền", statuses: ["delivered", "completed"] as OrderStatus[] },
        { id: "completed", label: "Hoàn thành", statuses: ["completed"] as OrderStatus[] },
        { id: "cancelled", label: "Đã hủy", statuses: ["cancelled"] as OrderStatus[] },
      ];

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch =
      deal.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.contact.toLowerCase().includes(searchQuery.toLowerCase());
    const activeNav = orderNav.find((item) => item.id === selectedFilter);
    const matchesFilter = statusConfig[selectedFilter as OrderStatus]
      ? deal.status === selectedFilter
      : selectedFilter === "all" || activeNav?.statuses.includes(deal.status);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{mode === "warehouse" ? "Theo dõi và xử lý các đơn hàng cần xuất kho" : mode === "technical" ? "Theo dõi và xử lý các đơn hàng kỹ thuật" : mode === "warranty" ? "Theo dõi và xử lý các đơn hàng bảo hành" : mode === "shipping" ? "Theo dõi và xử lý các đơn hàng giao hàng" : mode === "accounting" ? "Theo dõi và xử lý các đơn hàng kế toán" : "Theo dõi và quản lý các đơn hàng từ bộ phận sale"}</p>
        <button
          type="button"
          onClick={() => { setSelectedProducts([]); setProductSearch(""); setIsInvoiceOpen(true); }}
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          Tạo đơn
        </button>
      </div>

      {/* Filters and search */}
      <div className={cn(SURFACE_CARD, "space-y-3 p-3")}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, tên khách hàng hoặc số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(FIELD_BASE, "pl-9")}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground sm:ml-auto">
            <Filter className="w-4 h-4" />
            <span>{filteredDeals.length} đơn hàng</span>
          </div>
        </div>
        <div className="pt-3">
          <div className="flex flex-wrap gap-2">
            {orderNav.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedFilter(item.id)}
                className={cn(
                  "rounded-md px-4 py-2 text-xs font-semibold transition-all duration-200",
                  selectedFilter === item.id || item.statuses.includes(selectedFilter as OrderStatus)
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Table */}
      <div className={cn(SURFACE_CARD, "overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500")}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Công ty
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Liên hệ</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Giá trị
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Giai đoạn</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trạng thái</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nhân viên sale</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ngày chốt</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((deal, index) => {
                const status = statusConfig[deal.status];
                const StatusIcon = status.icon;

                return (
                  <tr
                    key={deal.id}
                    className="hover:bg-secondary/30 transition-colors duration-150 cursor-pointer animate-in fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                    onClick={() => setSelectedDeal(deal)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold", TONE_SURFACE.neutral)}>
                          {deal.company.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-foreground">{deal.company}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm text-foreground">{deal.contact}</p>
                        <p className="text-xs text-muted-foreground">{deal.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-semibold text-foreground">
                        ${deal.value.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={chip("neutral")}>
                        {deal.stage}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={cn(chip(status.tone), "gap-1")}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">{deal.rep}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">{deal.closeDate}</span>
                    </td>
                    <td className="py-4 px-4">
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 bg-secondary/30">
          <span className="text-sm text-muted-foreground">
            Hiển thị {filteredDeals.length} trên tổng số {deals.length} giao dịch
          </span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200">
              Previous
            </button>
            <button className="px-3 py-1.5 rounded-lg text-sm bg-accent text-accent-foreground font-medium">
              1
            </button>
            <button className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200">
              2
            </button>
            <button className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200">
              Next
            </button>
          </div>
        </div>
      </div>

      {cancelDeal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onMouseDown={() => setCancelDeal(null)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="cancel-order-title" className={cn(SURFACE_CARD, "w-full max-w-md p-6 shadow-2xl")} onMouseDown={(event) => event.stopPropagation()}>
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", TONE_SURFACE.danger)}><XCircle className="h-5 w-5" /></div>
            <h2 id="cancel-order-title" className="mt-4 text-lg font-semibold text-foreground">Xác nhận huỷ đơn?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Bạn có chắc muốn huỷ đơn của <strong className="text-foreground">{cancelDeal.company}</strong>? Hành động này sẽ được ghi lại trong nhật ký đơn hàng.</p>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setCancelDeal(null)} className="rounded-md bg-secondary/60 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary">Không, giữ lại</button><button type="button" onClick={() => { setCancelDeal(null); setSelectedDeal(null); }} className="rounded-md bg-danger px-4 py-2 text-sm font-semibold text-white hover:bg-danger/90">Xác nhận huỷ</button></div>
          </div>
        </div>
      )}

      {selectedDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/75 p-4 backdrop-blur-sm" onMouseDown={() => setSelectedDeal(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="order-details-title" className={cn(SURFACE_CARD, "max-h-[92vh] w-full max-w-4xl overflow-y-auto shadow-2xl")} onMouseDown={(event) => event.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between bg-card px-6 py-4">
              <div><p className="text-xs font-medium text-accent">Chi tiết đơn hàng #{selectedDeal.id.padStart(6, "0")}</p><h2 id="order-details-title" className="mt-1 text-lg font-semibold text-foreground">{selectedDeal.company}</h2></div>
              <button type="button" aria-label="Đóng chi tiết đơn hàng" onClick={() => setSelectedDeal(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-secondary/50 p-3"><p className="text-xs text-muted-foreground">Trạng thái</p><p className={cn("mt-1 text-sm font-semibold", TONE_TEXT[statusConfig[selectedDeal.status].tone])}>{statusConfig[selectedDeal.status].label}</p></div>
                <div className="rounded-lg bg-secondary/50 p-3"><p className="text-xs text-muted-foreground">Giá trị đơn</p><p className="mt-1 text-sm font-semibold text-foreground">${selectedDeal.value.toLocaleString()}</p></div>
                <div className="rounded-lg bg-secondary/50 p-3"><p className="text-xs text-muted-foreground">Ngày chốt</p><p className="mt-1 text-sm font-semibold text-foreground">{selectedDeal.closeDate}</p></div>
                <div className="rounded-lg bg-secondary/50 p-3"><p className="text-xs text-muted-foreground">Giai đoạn</p><p className="mt-1 text-sm font-semibold text-foreground">{selectedDeal.stage}</p></div>
              </div>
              <div className="rounded-lg bg-secondary/30 p-4"><h3 className="mb-3 text-sm font-semibold text-foreground">Thông tin khách hàng</h3><div className="grid gap-3 sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">Tên liên hệ</p><p className="mt-1 text-sm text-foreground">{selectedDeal.contact}</p></div><div><p className="text-xs text-muted-foreground">Email</p><p className="mt-1 text-sm text-foreground">{selectedDeal.email}</p></div><div><p className="text-xs text-muted-foreground">Số điện thoại</p><p className="mt-1 text-sm text-foreground">Chưa cập nhật</p></div><div><p className="text-xs text-muted-foreground">Địa chỉ</p><p className="mt-1 text-sm text-foreground">Chưa cập nhật</p></div></div></div>
              <div className="rounded-lg bg-secondary/30 p-4"><h3 className="mb-3 text-sm font-semibold text-foreground">Phân công xử lý</h3><div className="grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Nhân viên sale</p><p className="mt-1 text-sm text-foreground">{selectedDeal.rep}</p></div><div><p className="text-xs text-muted-foreground">Kho</p><p className="mt-1 text-sm text-muted-foreground">Chưa phân công</p></div><div><p className="text-xs text-muted-foreground">Kỹ thuật / giao hàng</p><p className="mt-1 text-sm text-muted-foreground">Chưa phân công</p></div></div></div>
              <div className="rounded-lg bg-secondary/30 p-4"><h3 className="mb-3 text-sm font-semibold text-foreground">Sản phẩm trong đơn</h3><div className="flex items-center justify-between border-b border-border py-3 text-sm"><span className="text-foreground">Bộ sản phẩm theo đơn hàng</span><span className="font-semibold text-foreground">${selectedDeal.value.toLocaleString()}</span></div><div className="flex items-center justify-between pt-3 text-base font-bold text-foreground"><span>Tổng thanh toán</span><span>${selectedDeal.value.toLocaleString()}</span></div></div>
              <div className="rounded-lg bg-secondary/30 p-4">
                <div className="mb-4 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-foreground">Nhật ký đơn hàng</h3><p className="mt-1 text-xs text-muted-foreground">Toàn bộ hoạt động phát sinh theo từng bộ phận</p></div><span className={cn(chip("neutral"), "gap-1")}>{orderLogs.reduce((total, group) => total + group.entries.length, 0)} hoạt động</span></div>
                <div className="space-y-4">{orderLogs.map((group) => <div key={group.department} className="grid gap-2 sm:grid-cols-[120px_1fr]"><p className="text-sm font-semibold text-muted-foreground">{group.department}</p><div className="space-y-2 border-l border-border pl-4">{group.entries.map((entry) => <div key={entry} className="relative text-sm text-muted-foreground before:absolute before:-left-[21px] before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-current"><span>{entry}</span></div>)}</div></div>)}</div>
              </div>
              <div className="flex justify-between gap-3"><button type="button" onClick={() => { setCancelDeal(selectedDeal); setSelectedDeal(null); }} className="rounded-md bg-danger/10 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/20">Huỷ đơn</button><button type="button" onClick={() => setSelectedDeal(null)} className="rounded-md bg-secondary/60 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary">Đóng</button></div>
            </div>
          </div>
        </div>
      )}

      {isInvoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/75 p-4 backdrop-blur-sm" onMouseDown={() => setIsInvoiceOpen(false)}>
          <div className={cn(SURFACE_CARD, "max-h-[92vh] w-full max-w-5xl overflow-y-auto shadow-2xl")} onMouseDown={(event) => event.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between bg-card px-6 py-4">
              <div><h2 className="text-lg font-semibold text-foreground">Tạo hóa đơn đặt hàng</h2><p className="text-sm text-muted-foreground">Nhập thông tin khách hàng và sản phẩm</p></div>
              <button type="button" aria-label="Đóng popup tạo đơn" onClick={() => setIsInvoiceOpen(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-6 p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["Khách hàng", "text"], ["Số điện thoại", "tel"], ["Địa chỉ", "text"], ["Kinh doanh", "text"],
                ].map(([label, type]) => (
                  <label key={label} className="space-y-1.5"><span className="text-xs font-medium text-muted-foreground">{label}</span><input type={type} placeholder={`Nhập ${label.toLowerCase()}`} className={FIELD_BASE} /></label>
                ))}
                <label className="space-y-1.5 sm:col-span-2 lg:col-span-3"><span className="text-xs font-medium text-muted-foreground">Diễn giải</span><textarea placeholder="Nhập diễn giải đơn hàng" rows={2} className={cn(FIELD_BASE, "h-auto w-full resize-none py-2")} /></label>
              </div>
              <div className="overflow-hidden rounded-lg bg-secondary/30">
                <div className="bg-secondary/50 px-4 py-3 text-sm font-semibold text-foreground">Danh sách sản phẩm</div>
                <div className="relative p-4">
                  <label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Tìm theo tên sản phẩm để thêm vào đơn..." className={cn(FIELD_BASE, "h-10 pl-9")} /></label>
                  {productSearch && <div className="absolute left-4 right-4 top-[4.5rem] z-20 overflow-hidden rounded-md border border-border bg-card shadow-xl">{filteredProducts.length ? filteredProducts.map((product) => <button key={product.name} type="button" onClick={() => addProduct(product)} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left last:border-0 hover:bg-secondary"><span className="text-sm font-medium text-foreground">{product.name}</span><span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground"><span>Số lượng: 1</span><span>{product.price.toLocaleString("vi-VN")} đ</span></span></button>) : <p className="px-4 py-3 text-sm text-muted-foreground">Không tìm thấy sản phẩm</p>}</div>}
                </div>
                <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead className="bg-secondary/30 text-xs text-muted-foreground"><tr><th className="px-3 py-3 text-left">STT</th><th className="px-3 py-3 text-left">Tên hàng hóa</th><th className="px-3 py-3 text-center">SL</th><th className="px-3 py-3 text-right">Đơn giá</th><th className="px-3 py-3 text-right">Thành tiền</th><th className="px-3 py-3 text-left">BH</th></tr></thead><tbody>{selectedProducts.length ? selectedProducts.map((product, index) => <tr key={product.name} className="last:border-0"><td className="px-3 py-3">{index + 1}</td><td className="px-3 py-3 font-medium text-foreground">{product.name}</td><td className="px-3 py-3 text-center">{product.quantity}</td><td className="px-3 py-3 text-right">{product.price.toLocaleString("vi-VN")}</td><td className="px-3 py-3 text-right font-medium">{(product.price * product.quantity).toLocaleString("vi-VN")}</td><td className="px-3 py-3">{product.warranty}</td></tr>) : <tr><td colSpan={6} className="px-3 py-10 text-center text-sm text-muted-foreground">Chưa có sản phẩm. Tìm kiếm và chọn sản phẩm để thêm vào đơn.</td></tr>}</tbody></table></div>
                <div className="ml-auto max-w-sm p-4 text-sm"><div className="flex justify-between py-1 text-muted-foreground"><span>Tổng cộng tiền hàng</span><strong className="text-foreground">{invoiceTotal.toLocaleString("vi-VN")}</strong></div><div className="flex justify-between py-1 text-muted-foreground"><span>Chiết khấu hóa đơn</span><strong className="text-foreground">0</strong></div><div className="flex justify-between border-t border-border pt-2 text-base font-bold text-foreground"><span>Thanh toán</span><span>{invoiceTotal.toLocaleString("vi-VN")}</span></div></div>
              </div>
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setIsInvoiceOpen(false)} className="rounded-md bg-secondary/60 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary">Hủy</button><button type="button" onClick={() => setIsInvoiceOpen(false)} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90">Lưu đơn hàng</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
