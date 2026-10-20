"use client";

import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface DateRange {
  /** YYYY-MM-DD */
  from: string;
  /** YYYY-MM-DD */
  to: string;
}

export type DatePreset = "today" | "week" | "month" | "custom";

export const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "today", label: "Hôm nay" },
  { id: "week", label: "Tuần này" },
  { id: "month", label: "Tháng này" },
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

/** Thứ Hai là ngày đầu tuần (chuẩn Việt Nam). */
function startOfWeek(base: Date): Date {
  const d = new Date(base);
  const day = d.getDay(); // 0 = Chủ nhật
  return shiftDays(d, -(day === 0 ? 6 : day - 1));
}

/** Tính from/to cho preset (giờ địa phương, bao gồm cả hôm nay). */
export function presetRange(preset: Exclude<DatePreset, "custom">, now = new Date()): DateRange {
  const to = toISODate(now);
  if (preset === "today") return { from: to, to };
  if (preset === "week") return { from: toISODate(startOfWeek(now)), to };
  return { from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)), to };
}

export function defaultDateRange(): DateRange {
  return presetRange("today");
}

export function formatRangeShort(range: DateRange, preset: DatePreset): string {
  if (preset !== "custom") return DATE_PRESETS.find((p) => p.id === preset)?.label || "";
  const f = (s: string) => s.split("-").reverse().join("/");
  return range.from === range.to ? f(range.from) : `${f(range.from)} – ${f(range.to)}`;
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

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
    const next = customFrom > customTo ? { from: customTo, to: customFrom } : { from: customFrom, to: customTo };
    onChange("custom", next);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Lọc theo ngày"
        className="gap-2"
      >
        <CalendarDays className="h-4 w-4 text-accent" />
        <span>{formatRangeShort(range, preset)}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Chọn khoảng ngày"
          className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-xl bg-popover p-1.5 text-popover-foreground shadow-2xl shadow-black/30"
        >
          {DATE_PRESETS.map(({ id, label }) => (
            <Button
              key={id}
              type="button"
              variant={preset === id ? "accent-soft" : "ghost"}
              size="sm"
              onClick={() => applyPreset(id)}
              aria-pressed={preset === id}
              className="w-full justify-between px-3"
            >
              {label}
              {preset === id && <Check className="h-4 w-4" />}
            </Button>
          ))}

          {preset === "custom" && (
            <div className="mt-1 space-y-2 rounded-lg bg-secondary/50 p-2.5">
              <label className="block text-[11px] text-muted-foreground">
                Từ ngày
                <Input
                  type="date"
                  value={customFrom}
                  max={toISODate(new Date())}
                  onChange={(event) => setCustomFrom(event.target.value)}
                  className="mt-1 h-8 rounded-md border-transparent bg-secondary px-2 text-xs"
                />
              </label>
              <label className="block text-[11px] text-muted-foreground">
                Đến ngày
                <Input
                  type="date"
                  value={customTo}
                  max={toISODate(new Date())}
                  onChange={(event) => setCustomTo(event.target.value)}
                  className="mt-1 h-8 rounded-md border-transparent bg-secondary px-2 text-xs"
                />
              </label>
              <Button
                type="button"
                size="sm"
                onClick={applyCustom}
                disabled={!customFrom || !customTo}
                className="w-full"
              >
                Áp dụng
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
