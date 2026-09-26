"use client";

import { AlertTriangle, Bell, CheckCircle2, Package, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { SURFACE_CARD, TONE_SURFACE, SECTION_TITLE, SECTION_SUBTITLE, chip, type Tone } from "@/lib/ui";

const notifications = [
  { icon: AlertTriangle, title: "Đơn hàng cần xử lý", description: "3 đơn hàng đang chờ xác nhận và đóng gói.", time: "5 phút trước", group: "Hôm nay", tone: "warning" as Tone, unread: true },
  { icon: Package, title: "Kho sắp hết hàng", description: "Mặt hàng MacBook Pro chỉ còn 4 sản phẩm trong kho.", time: "32 phút trước", group: "Hôm nay", tone: "warning" as Tone, unread: true },
  { icon: CheckCircle2, title: "Giao dịch hoàn tất", description: "Đơn #DH-2048 đã thanh toán thành công.", time: "1 giờ trước", group: "Hôm nay", tone: "success" as Tone, unread: false },
  { icon: Bell, title: "Báo cáo tháng đã sẵn sàng", description: "Báo cáo hiệu suất tháng 8 đã được cập nhật.", time: "Hôm qua", group: "Hôm qua", tone: "info" as Tone, unread: false },
];

export function NotificationsPage() {
  return <div className="space-y-6"><div className={cn(SURFACE_CARD, "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between")}><div><div className="flex items-center gap-2"><span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", TONE_SURFACE.accent)}><Bell className="h-5 w-5" /></span><h2 className={SECTION_TITLE}>Tất cả thông báo</h2></div><p className={SECTION_SUBTITLE}>Theo dõi các cập nhật mới nhất từ hoạt động kinh doanh của bạn.</p></div><button className="rounded-lg bg-secondary/30 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/10">Đánh dấu đã đọc</button></div><div className={cn(SURFACE_CARD, "p-5")}><div className="mb-5 flex items-center justify-between"><p className="text-sm font-medium text-foreground">Thông báo gần đây <span className={cn("ml-1", chip("accent"))}>2 mới</span></p><button className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Tùy chọn thông báo"><MoreHorizontal className="h-5 w-5" /></button></div><div className="space-y-5">{notifications.map(({ icon: Icon, title, description, time, group, tone, unread }, index) => <div key={title} className="relative">{(index === 0 || notifications[index - 1].group !== group) && <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>}<div className={cn("flex gap-4 rounded-xl p-3 transition hover:bg-secondary/60", unread && "bg-accent/[0.04]")}><span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", TONE_SURFACE[tone])}><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="font-medium text-foreground">{title}</p>{unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}</div><p className="mt-1 text-sm text-muted-foreground">{description}</p><p className="mt-2 text-xs text-muted-foreground/70">{time}</p></div></div></div>)}</div></div></div>;
}
