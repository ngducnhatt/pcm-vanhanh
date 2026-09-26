"use client";

import { Search, ArrowUpRight, Package, UserRound, ReceiptText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTION_SUBTITLE, SECTION_TITLE, SURFACE_CARD, TONE_SURFACE } from "@/lib/ui";

const results = [
  { type: "Đơn hàng", title: "#DH-2048 · MacBook Pro 14 inch", detail: "Nguyễn Minh Anh · 48.500.000 ₫", icon: Package },
  { type: "Khách hàng", title: "Công ty TNHH Sao Mai", detail: "12 đơn hàng · Đang hoạt động", icon: UserRound },
  { type: "Giao dịch", title: "Thanh toán #GD-7832", detail: "Hoàn tất · 24.800.000 ₫", icon: ReceiptText },
];

export function SearchResults({ query, onClose }: { query: string; onClose: () => void }) {
  return (
    <div className="space-y-6">
      <div className={cn(SURFACE_CARD, "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between")}>
        <div><p className={SECTION_SUBTITLE}>Kết quả tìm kiếm</p><h2 className={SECTION_TITLE}>Tìm thấy cho “{query || "tất cả"}”</h2></div>
        <button onClick={onClose} className="flex items-center gap-2 self-start rounded-lg bg-secondary/30 px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="h-4 w-4" />Đóng tìm kiếm</button>
      </div>
      <div className="grid gap-3">
        {results.map(({ type, title, detail, icon: Icon }) => (
          <button key={title} className={cn(SURFACE_CARD, "group flex items-center gap-4 p-4 text-left transition hover:border-accent/50 hover:bg-accent/5")}>
            <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", TONE_SURFACE.accent)}><Icon className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="mb-1 block text-xs font-medium uppercase tracking-wider text-accent">{type}</span><span className="block truncate font-medium text-foreground">{title}</span><span className="mt-1 block text-sm text-muted-foreground">{detail}</span></span>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
          </button>
        ))}
      </div>
      <div className={cn(SURFACE_CARD, "flex flex-col items-center justify-center border-dashed bg-card/50 px-6 py-12 text-center")}><Search className="mb-3 h-8 w-8 text-muted-foreground/50" /><p className="font-medium text-foreground">Bạn muốn tìm nội dung khác?</p><p className="mt-1 text-sm text-muted-foreground">Thử tìm theo mã đơn hàng, tên khách hàng hoặc giao dịch.</p></div>
    </div>
  );
}
