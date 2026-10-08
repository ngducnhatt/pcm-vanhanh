"use client";

import React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-context";
import { operationNavFor, primaryNavFor } from "@/lib/nav";
import { asRole, ROLE_TEXT_STYLE } from "@/lib/ui";
import { ChevronLeft, ChevronRight, Cpu } from "lucide-react";

interface SidebarProps {
  activeSection: string;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

/** Chuẩn chung cho mọi mục điều hướng (dùng chung sidebar tokens) */
const NAV_ITEM_BASE =
  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative";
const NAV_ITEM_ACTIVE = "bg-sidebar-accent text-sidebar-foreground";
const NAV_ITEM_IDLE = "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50";
const NAV_ICON = "w-5 h-5 shrink-0";
const NAV_RAIL =
  "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-accent";
const navLabel = (collapsed: boolean) =>
  cn(
    "whitespace-nowrap transition-all duration-300",
    collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
  );

export function Sidebar({
  activeSection,
  collapsed,
  onCollapsedChange,
}: SidebarProps) {
  const { roles } = useAuth();

  // Nhân viên chỉ thấy 3 mục tối thiểu; nhóm "Vận hành" là của riêng Admin
  const operationItems = operationNavFor(roles);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-out flex flex-col",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-accent">
            <Cpu className="w-5 h-5 text-accent-foreground" />
          </div>
          <span
            className={cn(
              "text-base font-semibold leading-tight text-sidebar-foreground whitespace-nowrap transition-all duration-300",
              collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
            )}
          >
            PCM Vận Hành
            <span className="block text-xs font-normal text-muted-foreground">
              Linh kiện máy tính
            </span>
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-hidden overflow-y-auto">
        <div className="space-y-1">
          {primaryNavFor(roles).map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(NAV_ITEM_BASE, isActive ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE)}
              >
                <span className={cn(NAV_RAIL, isActive ? "opacity-100" : "opacity-0")} />
                <Icon className={cn(NAV_ICON, isActive ? "text-accent" : "group-hover:scale-110")} />
                <span className={navLabel(collapsed)}>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {operationItems.length > 0 && (
          <div className={cn("my-5 pt-4", collapsed && "mt-4 pt-3")}>
            <div className={cn("px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground", collapsed && "sr-only")}>
              Vận hành
            </div>
            <div className="space-y-1">
              {operationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                const queueRole = asRole(item.queue);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(NAV_ITEM_BASE, isActive ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE)}
                  >
                    <span className={cn(NAV_RAIL, isActive ? "opacity-100" : "opacity-0")} />
                    <Icon
                      className={cn(
                        NAV_ICON,
                        isActive ? "text-accent" : queueRole ? ROLE_TEXT_STYLE[queueRole] : "",
                        !isActive && "group-hover:scale-110"
                      )}
                    />
                    <span className={navLabel(collapsed)}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Collapse button */}
      <div className="p-3">
        <button
          onClick={() => onCollapsedChange(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span>Thu gọn</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
