"use client";

import { CalendarDays, ChevronDown, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface DateRange {
  /** YYYY-MM-DD */
  from: string;
  /** YYYY-MM-DD */
  to: string;
}

export type DatePreset = "today" | "3days" | "7days" | "custom";

export const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "today", label: "Hôm nay" },
  { id: "3days", label: "3 ngày qua" },
  { id: "7days", label: "7 ngày qua" },
  { id: "custom", label: "Tùy chỉnh" },
];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftDays(base: Date, delta: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + delta);
  return d;
}

/** Tính from/to cho preset (giờ địa phương, bao gồm cả hôm nay) */
export function presetRange(preset: Exclude<DatePreset, "custom">, now = new Date()): DateRange {
  const to = toISODate(now);
  if (preset === "today") return { from: to, to };
  if (preset === "3days") return { from: toISODate(shiftDays(now, -2)), to };
  return { from: toISODate(shiftDays(now, -6)), to };
}

export function defaultDateRange(): DateRange {
  return presetRange("7days");
}

export function formatRangeShort(range: DateRange, preset: DatePreset): string {
  if (preset !== "custom") return DATE_PRESETS.find((p) => p.id === preset)?.label || "";
  if (range.from === range.to) return range.from.split("-").reverse().join("/");
  const f = (s: string) => s.split("-").reverse().join("/");
  return `${f(range.from)} – ${f(range.to)}`;
}

interface DateRangePickerProps {
  preset: DatePreset;
  range: DateRange;
  onChange: (preset: DatePreset, range: DateRange) => void;
}

export function DateRangePicker({ preset, range, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(range.from);
  const [customTo, setCustomTo] = useState(range.to);

  const applyPreset = (id: DatePreset) => {
    if (id === "custom") {
      setCustomFrom(range.from);
      setCustomTo(range.to);
      onChange("custom", range);
      return;
    }
    onChange(id, presetRange(id));
    setOpen(false);
  };

  const applyCustom = () => {
    if (!customFrom || !customTo) return;
    if (customFrom > customTo) {
      onChange("custom", { from: customTo, to: customFrom });
    } else {
      onChange("custom", { from: customFrom, to: customTo });
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 items-center gap-2 rounded-lg border border-transparent bg-secondary/60 px-3 text-sm text-foreground transition-colors hover:border-accent/40 hover:bg-secondary"
        aria-expanded={open}
        title="Lọc theo ngày"
      >
        <CalendarDays className="h-4 w-4 text-accent" />
        <span>{formatRangeShort(range, preset)}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-60 overflow-hidden rounded-xl bg-popover p-1.5 text-popover-foreground shadow-2xl shadow-black/30">
          {DATE_PRESETS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => applyPreset(id)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                preset === id
                  ? "bg-accent/10 text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {label}
              {preset === id && <Check className="h-4 w-4 text-accent" />}
            </button>
          ))}
          {preset === "custom" && (
            <div className="mt-1 space-y-2 rounded-lg bg-secondary/50 p-2.5">
              <label className="block text-[11px] text-muted-foreground">
                Từ ngày
                <input
                  type="date"
                  value={customFrom}
                  max={toISODate(new Date())}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="mt-1 h-8 w-full rounded-md bg-secondary px-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-accent/50"
                />
              </label>
              <label className="block text-[11px] text-muted-foreground">
                Đến ngày
                <input
                  type="date"
                  value={customTo}
                  max={toISODate(new Date())}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="mt-1 h-8 w-full rounded-md bg-secondary px-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-accent/50"
                />
              </label>
              <button
                onClick={applyCustom}
                disabled={!customFrom || !customTo}
                className="h-8 w-full rounded-md bg-accent text-xs font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
              >
                Áp dụng
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
