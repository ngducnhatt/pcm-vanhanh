"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth-context";
import { Order, OrderStatus, ROLE_LABELS, STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/types";
import {
  ShoppingCart,
  Warehouse,
  Wrench,
  Eye,
  ShieldCheck,
  Truck,
  Bike,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Trash2,
  FileText,
  ScanBarcode,
  CheckCircle2,
  Clock,
  Printer,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  Navigation,
  Phone,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { chip } from "@/lib/ui";
import { CreateOrderModal } from "@/components/orders/create-order-modal";
import { EditOrderModal } from "@/components/orders/edit-order-modal";
import { OrderDetailsModal } from "@/components/orders/order-details-modal";
import { ExportWarehouseModal } from "@/components/warehouse/export-warehouse-modal";
import { PrintInvoiceModal } from "@/components/warehouse/print-invoice-modal";
import { AssignShipmentModal } from "@/components/shipping/assign-shipment-modal";
import { CollectPaymentModal } from "@/components/shipping/collect-payment-modal";

const ORDER_STATUS_FILTERS: { value: OrderStatus; label: string }[] = [
  { value: "draft", label: STATUS_LABELS.draft.label },
  { value: "new", label: STATUS_LABELS.new.label },
  { value: "kho_pending", label: "Chờ kho xuất" },
  { value: "kho_done", label: STATUS_LABELS.kho_done.label },
  { value: "kithuat_pending", label: STATUS_LABELS.kithuat_pending.label },
  { value: "kithuat_done", label: STATUS_LABELS.kithuat_done.label },
  { value: "baohanh_pending", label: STATUS_LABELS.baohanh_pending.label },
  { value: "baohanh_done", label: STATUS_LABELS.baohanh_done.label },
  { value: "ship_pending", label: STATUS_LABELS.ship_pending.label },
  { value: "ship_assigned", label: STATUS_LABELS.ship_assigned.label },
  { value: "ship_dangiao", label: STATUS_LABELS.ship_dangiao.label },
  { value: "ship_done", label: STATUS_LABELS.ship_done.label },
  { value: "completed", label: STATUS_LABELS.completed.label },
  { value: "cancelled", label: STATUS_LABELS.cancelled.label },
];

interface OrdersHubProps {
  initialQueue?: string;
}

export function OrdersHub({ initialQueue }: OrdersHubProps) {
  const { currentUser, role } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "all">("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("all");

  // Admin tab filter
  const [adminTab, setAdminTab] = useState<string>(initialQueue || "all");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<string | null>(null);
  const [selectedOrderForExport, setSelectedOrderForExport] = useState<Order | null>(null);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const [selectedOrderForShipment, setSelectedOrderForShipment] = useState<Order | null>(null);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      // If user is admin and chosen a tab
      if (role === "admin") {
        if (adminTab !== "all") {
          params.append("role_queue", adminTab);
        }
      } else {
        // Enforce role-based queue automatically
        params.append("role_queue", role);
      }

      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }
      if (selectedPaymentStatus !== "all") {
        params.append("payment_status", selectedPaymentStatus);
      }

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch {
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setIsLoading(false);
    }
  }, [role, adminTab, searchQuery, selectedPaymentStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle Quick Status Actions
  const handleTransitionStatus = async (
    orderId: string,
    action: string,
    promptTitle: string,
    defaultNote: string
  ) => {
    const userNote = window.prompt(promptTitle, defaultNote);
    if (userNote === null) return; // user cancelled

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: userNote }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Lỗi cập nhật trạng thái");
      }

      toast.success(data.message || "Cập nhật thành công!");
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật trạng thái");
    }
  };

  const handleCancelOrder = async (order: Order) => {
    const reason = window.prompt(
      `Xác nhận hủy đơn hàng ${order.invoice_no} (${order.customer_name})?\nNhập lý do hủy:`,
      "Khách hàng yêu cầu hủy đơn"
    );
    if (reason === null) return;

    try {
      const res = await fetch(`/api/orders/${order.id}?reason=${encodeURIComponent(reason)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Lỗi hủy đơn hàng");
      }

      toast.success(data.message || "Đã hủy đơn hàng thành công!");
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Lỗi hủy đơn hàng");
    }
  };

  const filteredOrders =
    selectedStatus === "all"
      ? orders
      : orders.filter((order) => order.status === selectedStatus);

  return (
    <div className="space-y-5">
      {/* Top Banner & Header info */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">
              {role === "admin"
                ? "Trung Tâm Điều Hành & Quản Lý Đơn Hàng"
                : `Hàng Đợi Xử Lý: ${ROLE_LABELS[role]}`}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent">
              {filteredOrders.length} đơn hàng
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {role === "kinh_doanh" && "Tạo đơn linh kiện, chọn thanh toán, sửa/hủy đơn trước khi hoàn tất."}
            {role === "kho" && "Hàng đợi xuất kho: Quét mã vạch tự động nhận sản phẩm, gán serial và in phiếu."}
            {role === "ky_thuat" && "Hàng đợi kỹ thuật: Lắp ráp linh kiện, đi dây, cài Win và stress test."}
            {role === "quan_ly_ky_thuat" && "Chế độ giám sát điều phối: Xem toàn bộ tiến độ kỹ thuật, không có bước duyệt chặn luồng."}
            {role === "bao_hanh" && "Hàng đợi bảo hành: Tiếp nhận, kiểm tra linh kiện lỗi và đổi trả bảo hành."}
            {role === "quan_ly_ship" && "Hàng đợi điều phối: Phân công shipper, tính km với Google Maps Distance Matrix."}
            {role === "shipper" && "Giao diện giao hàng: Nhận đơn, cập nhật đang giao, giao xong và thu tiền COD."}
            {role === "admin" && "Toàn quyền giám sát luồng state machine qua từng bộ phận."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchOrders}
            className="p-2 rounded-lg bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>

          {(role === "kinh_doanh" || role === "admin") && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 flex items-center gap-2 cursor-pointer shadow"
            >
              <Plus className="w-4 h-4" /> Tạo đơn hàng mới
            </button>
          )}
        </div>
      </div>

      {/* Admin Department Tabs */}
      {role === "admin" && (
        <div className="flex flex-wrap gap-1.5 p-1 bg-secondary/50 rounded-lg text-xs">
          {[
            { id: "all", label: "Tất cả đơn hàng", icon: ShoppingCart },
            { id: "kho", label: "Hàng đợi Kho", icon: Warehouse },
            { id: "ky_thuat", label: "Hàng đợi Kỹ thuật", icon: Wrench },
            { id: "bao_hanh", label: "Hàng đợi Bảo hành", icon: ShieldCheck },
            { id: "quan_ly_ship", label: "Hàng đợi Quản lý Ship", icon: Truck },
            { id: "shipper", label: "Hàng đợi Shipper", icon: Bike },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = adminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer",
                  isActive
                    ? "bg-accent/15 text-accent font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="relative md:col-span-2">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn (HD-...), tên khách, số điện thoại..."
            className="w-full h-8 pl-9 pr-3 rounded-lg bg-secondary/60 border border-transparent focus:outline-none focus:border-accent/60 focus:bg-secondary"
          />
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as OrderStatus | "all")}
            className="w-full h-8 px-2.5 rounded-lg bg-secondary/60 border border-transparent text-foreground focus:outline-none focus:border-accent/60 focus:bg-secondary cursor-pointer"
          >
            <option value="all">Tất cả trạng thái đơn hàng</option>
            {ORDER_STATUS_FILTERS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedPaymentStatus}
            onChange={(e) => setSelectedPaymentStatus(e.target.value)}
            className="w-full h-8 px-2.5 rounded-lg bg-secondary/60 border border-transparent text-foreground focus:outline-none focus:border-accent/60 focus:bg-secondary cursor-pointer"
          >
            <option value="all">Tất cả trạng thái thanh toán</option>
            <option value="unpaid">Chưa thanh toán (0%)</option>
            <option value="partial">Thanh toán một phần (Cọc)</option>
            <option value="full">Đã thanh toán đủ (100%)</option>
          </select>
        </div>
      </div>

      {/* Orders List / Table */}
      <div className="rounded-xl overflow-hidden bg-card">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground text-xs">
            Đang tải dữ liệu đơn hàng...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="text-muted-foreground text-sm font-medium">
              Không có đơn hàng nào trong hàng đợi này.
            </div>
            <p className="text-xs text-muted-foreground/70">
              Hãy tạo đơn mới hoặc đổi bộ lọc tìm kiếm để xem các đơn hàng khác.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-secondary/60 text-muted-foreground">
                <tr>
                  <th className="p-3">Mã đơn / Ngày</th>
                  <th className="p-3">Khách hàng</th>
                  <th className="p-3">Tags & Quy trình</th>
                  <th className="p-3 text-right">Tổng tiền</th>
                  <th className="p-3 text-center">Thanh toán</th>
                  <th className="p-3 text-center">Trạng thái đơn</th>
                  <th className="p-3 text-right">Thao tác xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredOrders.map((order) => {
                  const statusInfo = STATUS_LABELS[order.status] || {
                    label: order.status,
                    color: "bg-secondary text-foreground",
                  };
                  const paymentInfo = PAYMENT_STATUS_LABELS[order.payment_status];

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-secondary/25 transition-colors group"
                    >
                      {/* Mã đơn & Ngày */}
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedOrderForDetails(order.id)}
                          className="font-mono font-bold text-accent hover:underline text-left cursor-pointer"
                        >
                          {order.invoice_no}
                        </button>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {order.invoice_date}
                        </div>
                      </td>

                      {/* Khách hàng */}
                      <td className="p-3">
                        <div className="font-semibold text-foreground">
                          {order.customer_name}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {order.customer_phone}
                        </div>
                      </td>

                      {/* Tags */}
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {order.tags && order.tags.length > 0 ? (
                            order.tags.map((t) => (
                              <span
                                key={t}
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                  t === "kithuat"
                                    ? "bg-accent/15 text-accent"
                                    : t === "baohanh"
                                    ? "bg-warning/15 text-warning"
                                    : "bg-secondary text-muted-foreground"
                                )}
                              >
                                {t === "kithuat" ? "🔧 Kỹ thuật" : t === "baohanh" ? "🛡️ Bảo hành" : t}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">Mặc định</span>
                          )}
                        </div>
                      </td>

                      {/* Tổng tiền */}
                      <td className="p-3 text-right">
                        <div className="font-bold text-foreground">
                          {order.total_amount.toLocaleString()}đ
                        </div>
                        {order.paid_amount > 0 && order.paid_amount < order.total_amount && (
                          <div className="text-[10px] text-success">
                            Đã thu: {order.paid_amount.toLocaleString()}đ
                          </div>
                        )}
                      </td>

                      {/* Thanh toán */}
                      <td className="p-3 text-center">
                        <span className={chip(paymentInfo.tone)}>
                          {paymentInfo.label}
                        </span>
                      </td>

                      {/* Trạng thái đơn */}
                      <td className="p-3 text-center">
                        <span className={cn(chip(statusInfo.tone), "whitespace-nowrap")}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Thao tác theo vai trò */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* 1. XEM CHI TIẾT */}
                          <button
                            onClick={() => setSelectedOrderForDetails(order.id)}
                            className="p-1.5 rounded bg-secondary hover:bg-secondary/80 text-foreground cursor-pointer"
                            title="Xem chi tiết đơn"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. KHO ACTIONS */}
                          {(role === "kho" || role === "admin") &&
                            (order.status === "new" || order.status === "kho_pending") && (
                              <button
                                onClick={async () => {
                                  // Fetch order full items before opening
                                  const res = await fetch(`/api/orders/${order.id}`);
                                  if (res.ok) {
                                    const d = await res.json();
                                    setSelectedOrderForExport(d.order);
                                  }
                                }}
                                className="px-2.5 py-1 rounded bg-warning/15 text-warning hover:bg-warning/25 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <ScanBarcode className="w-3.5 h-3.5" /> Xuất đơn & Quét
                              </button>
                            )}

                          {/* 3. KỸ THUẬT ACTIONS */}
                          {(role === "ky_thuat" || role === "admin") &&
                            order.status === "kithuat_pending" && (
                              <button
                                onClick={() =>
                                  handleTransitionStatus(
                                    order.id,
                                    "complete_kithuat",
                                    "Xác nhận hoàn thành kỹ thuật (Lắp ráp, cài đặt, test)? Nhập ghi chú:",
                                    "Kỹ thuật viên đã kiểm tra linh kiện, lắp ráp hoàn chỉnh và stress test thành công"
                                  )
                                }
                                className="px-2.5 py-1 rounded bg-accent/15 text-accent hover:bg-accent/25 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành KT
                              </button>
                            )}

                          {/* 4. QUẢN LÝ KỸ THUẬT: Chỉ giám sát điều phối, KHÔNG DUYỆT */}
                          {role === "quan_ly_ky_thuat" && (
                            <span className="rounded-md px-2 py-1 text-[11px] font-medium bg-accent/15 text-accent">
                              👁️ Giám sát tiến độ
                            </span>
                          )}

                          {/* 5. BẢO HÀNH ACTIONS */}
                          {(role === "bao_hanh" || role === "admin") &&
                            order.status === "baohanh_pending" && (
                              <button
                                onClick={() =>
                                  handleTransitionStatus(
                                    order.id,
                                    "complete_baohanh",
                                    "Xác nhận hoàn thành bảo hành linh kiện? Nhập ghi chú:",
                                    "Đã kiểm tra lỗi và đổi mới linh kiện bảo hành cho khách hàng"
                                  )
                                }
                                className="px-2.5 py-1 rounded bg-success/15 text-success hover:bg-success/25 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành BH
                              </button>
                            )}

                          {/* 6. QUẢN LÝ SHIP ACTIONS */}
                          {(role === "quan_ly_ship" || role === "admin") &&
                            order.status === "ship_pending" && (
                              <button
                                onClick={() => setSelectedOrderForShipment(order)}
                                className="px-2.5 py-1 rounded bg-warning/15 text-warning hover:bg-warning/25 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Truck className="w-3.5 h-3.5" /> Phân công ship
                              </button>
                            )}

                          {/* 7. SHIPPER ACTIONS */}
                          {(role === "shipper" || role === "admin") && (
                            <>
                              {order.status === "ship_assigned" && (
                                <button
                                  onClick={() =>
                                    handleTransitionStatus(
                                      order.id,
                                      "start_delivery",
                                      "Bắt đầu giao đơn hàng này? Nhập ghi chú:",
                                      "Shipper đã nhận hàng từ kho và đang trên đường giao"
                                    )
                                  }
                                  className="px-2.5 py-1 rounded bg-warning/15 text-warning hover:bg-warning/25 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <Bike className="w-3.5 h-3.5" /> Bắt đầu giao
                                </button>
                              )}

                              {order.status === "ship_dangiao" && (
                                <button
                                  onClick={() =>
                                    handleTransitionStatus(
                                      order.id,
                                      "complete_delivery",
                                      "Xác nhận đã giao hàng thành công? Nhập ghi chú:",
                                      "Đã giao tận tay khách hàng"
                                    )
                                  }
                                  className="px-2.5 py-1 rounded bg-success/15 text-success hover:bg-success/25 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Giao xong
                                </button>
                              )}

                              {order.payment_status !== "full" && (
                                <button
                                  onClick={() => setSelectedOrderForPayment(order)}
                                  className="rounded-md px-2.5 py-1.5 bg-accent text-accent-foreground hover:opacity-90 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-opacity"
                                >
                                  <DollarSign className="w-3.5 h-3.5" /> Thu tiền
                                </button>
                              )}
                            </>
                          )}

                          {/* 8. KINH DOANH: Sửa & Hủy đơn */}
                          {(role === "kinh_doanh" || role === "kho" || role === "admin") &&
                            order.status !== "completed" &&
                            order.status !== "cancelled" && (
                              <>
                                <button
                                  onClick={async () => {
                                    const res = await fetch(`/api/orders/${order.id}`);
                                    if (res.ok) {
                                      const d = await res.json();
                                      setSelectedOrderForEdit(d.order);
                                    }
                                  }}
                                  className="p-1.5 rounded bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground cursor-pointer"
                                  title="Sửa đơn hàng (sau khi kho xuất sẽ ghi nhận và rollback quy trình)"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleCancelOrder(order)}
                                  className="p-1.5 rounded bg-secondary text-muted-foreground hover:bg-danger/20 hover:text-danger cursor-pointer transition-colors"
                                  title="Hủy đơn hàng"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                          {/* IN PHIẾU XUẤT */}
                          <button
                            onClick={async () => {
                              const res = await fetch(`/api/orders/${order.id}`);
                              if (res.ok) {
                                const d = await res.json();
                                setSelectedOrderForPrint(d.order);
                              }
                            }}
                            className="p-1.5 rounded bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-accent cursor-pointer"
                            title="In phiếu xuất kho & bàn giao"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALS */}
      <CreateOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchOrders}
      />

      <EditOrderModal
        order={selectedOrderForEdit}
        isOpen={Boolean(selectedOrderForEdit)}
        onClose={() => setSelectedOrderForEdit(null)}
        onSuccess={fetchOrders}
      />

      <OrderDetailsModal
        orderId={selectedOrderForDetails}
        isOpen={Boolean(selectedOrderForDetails)}
        onClose={() => setSelectedOrderForDetails(null)}
        onOpenPrint={(ord) => setSelectedOrderForPrint(ord)}
      />

      <ExportWarehouseModal
        order={selectedOrderForExport}
        isOpen={Boolean(selectedOrderForExport)}
        onClose={() => setSelectedOrderForExport(null)}
        onSuccess={fetchOrders}
        onOpenPrint={(ord) => setSelectedOrderForPrint(ord)}
      />

      <PrintInvoiceModal
        order={selectedOrderForPrint}
        isOpen={Boolean(selectedOrderForPrint)}
        onClose={() => setSelectedOrderForPrint(null)}
      />

      <AssignShipmentModal
        order={selectedOrderForShipment}
        isOpen={Boolean(selectedOrderForShipment)}
        onClose={() => setSelectedOrderForShipment(null)}
        onSuccess={fetchOrders}
      />

      <CollectPaymentModal
        order={selectedOrderForPayment}
        isOpen={Boolean(selectedOrderForPayment)}
        onClose={() => setSelectedOrderForPayment(null)}
        onSuccess={fetchOrders}
      />
    </div>
  );
}
