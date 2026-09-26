"use client";

import { CalendarDays, ChevronDown, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const ranges = ["Hôm nay", "7 ngày qua", "30 ngày qua", "Quý này", "Năm nay", "Tùy chỉnh"];

export function DateRangePicker() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("30 ngày qua");

  return (
    <div className="relative">
      <button onClick={() => setOpen((value) => !value)} className="flex h-9 items-center gap-2 rounded-lg border border-transparent bg-secondary/60 px-3 text-sm text-foreground transition-colors hover:border-accent/40 hover:bg-secondary" aria-expanded={open}>
        <CalendarDays className="h-4 w-4 text-accent" />
        <span>{selected}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-48 overflow-hidden rounded-xl bg-popover bg-popover p-1.5 text-popover-foreground shadow-2xl shadow-black/30">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => { setSelected(range); setOpen(false); }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                selected === range
                  ? "bg-accent/10 text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {range}
              {selected === range && <Check className="h-4 w-4 text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
