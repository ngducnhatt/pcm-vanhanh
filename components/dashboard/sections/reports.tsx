"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ChevronDown, Download, Filter, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  FIELD_BASE,
  SECTION_TITLE,
  SURFACE_CARD,
  TONE_SURFACE,
  TONE_TEXT,
  chip,
  type Tone,
} from "@/lib/ui";

type Transaction = {
  id: string;
  code: string;
  customer: string;
  type: "Thu tiền" | "Chi tiền" | "Hoàn tiền";
  method: string;
  amount: string;
  date: string;
  status: "Hoàn tất" | "Đang xử lý" | "Đã hủy";
};

const transactions: Transaction[] = [
  { id: "1", code: "GD-240125-001", customer: "Công ty Minh Long", type: "Thu tiền", method: "Chuyển khoản", amount: "+ 24.500.000 ₫", date: "25/01/2024 · 14:32", status: "Hoàn tất" },
  { id: "2", code: "GD-240125-002", customer: "Nguyễn Hoàng Nam", type: "Thu tiền", method: "Tiền mặt", amount: "+ 8.750.000 ₫", date: "25/01/2024 · 11:18", status: "Hoàn tất" },
  { id: "3", code: "GD-240124-008", customer: "Cửa hàng Phúc An", type: "Hoàn tiền", method: "Chuyển khoản", amount: "- 3.200.000 ₫", date: "24/01/2024 · 16:05", status: "Đang xử lý" },
  { id: "4", code: "GD-240124-006", customer: "Trần Quốc Bảo", type: "Thu tiền", method: "Thẻ ngân hàng", amount: "+ 12.900.000 ₫", date: "24/01/2024 · 09:44", status: "Hoàn tất" },
  { id: "5", code: "GD-240123-011", customer: "Công ty Sao Việt", type: "Chi tiền", method: "Chuyển khoản", amount: "- 6.500.000 ₫", date: "23/01/2024 · 15:27", status: "Đã hủy" },
  { id: "6", code: "GD-240123-004", customer: "Lê Thanh Tùng", type: "Thu tiền", method: "Ví điện tử", amount: "+ 5.400.000 ₫", date: "23/01/2024 · 10:12", status: "Hoàn tất" },
];

const filters = ["Tất cả", "Thu tiền", "Chi tiền", "Hoàn tiền"];

const statusTones: Record<Transaction["status"], Tone> = {
  "Hoàn tất": "success",
  "Đang xử lý": "warning",
  "Đã hủy": "danger",
};

export function ReportsSection() {
  const [activeFilter, setActiveFilter] = useState("Tất cả");
  const [query, setQuery] = useState("");

  const filteredTransactions = useMemo(() => transactions.filter((transaction) => {
    const matchesFilter = activeFilter === "Tất cả" || transaction.type === activeFilter;
    const normalizedQuery = query.toLowerCase();
    return matchesFilter && `${transaction.code} ${transaction.customer}`.toLowerCase().includes(normalizedQuery);
  }), [activeFilter, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className={SECTION_TITLE}>Giao dịch</h2>
        </div>
        <Button type="button" size="sm" className="gap-2">
          <Download className="h-4 w-4" /> Xuất báo cáo
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <Button
              key={filter}
              type="button"
              variant={activeFilter === filter ? "default" : "secondary"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              aria-pressed={activeFilter === filter}
            >
              {filter}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã hoặc khách hàng..." className={cn(FIELD_BASE, "bg-card pl-9 sm:w-64")} />
          </div>
          <Button type="button" variant="secondary" size="sm" aria-label="Bộ lọc nâng cao">
            <Filter className="h-4 w-4" /> Lọc
          </Button>
        </div>
      </div>

      <div className={cn(SURFACE_CARD, "overflow-hidden")}>
        <div className="flex items-center justify-between px-5 py-4">
          <div><h3 className="font-semibold text-foreground">Danh sách giao dịch</h3><p className="mt-1 text-xs text-muted-foreground">{filteredTransactions.length} giao dịch được hiển thị</p></div>
          <Button type="button" variant="ghost" size="xs">
            Mới nhất <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        <div className="divide-y divide-border/50">
          {filteredTransactions.map((transaction) => {
            const isIncoming = transaction.type === "Thu tiền";
            const amountTone: Tone = isIncoming ? "success" : "danger";
            return <div key={transaction.id} className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-secondary/30 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3"><div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", TONE_SURFACE[amountTone])}>{isIncoming ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}</div><div><p className="font-medium text-foreground">{transaction.code}</p><p className="text-sm text-muted-foreground">{transaction.customer} · {transaction.method}</p></div></div>
              <div className="flex items-center justify-between gap-6 md:justify-end"><div className="text-left md:text-right"><p className={cn("font-semibold", TONE_TEXT[amountTone])}>{transaction.amount}</p><p className="text-xs text-muted-foreground">{transaction.date}</p></div><span className={chip(statusTones[transaction.status])}>{transaction.status}</span></div>
            </div>;
          })}
          {filteredTransactions.length === 0 && <div className="px-5 py-12 text-center text-sm text-muted-foreground">Không tìm thấy giao dịch phù hợp</div>}
        </div>
      </div>
    </div>
  );
}
