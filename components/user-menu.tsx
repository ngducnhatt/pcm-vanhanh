"use client";

import { useState } from "react";
import { ChevronDown, KeyRound, LogOut, ShieldCheck, UserCog } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth-context";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { ROLE_META, roleChip } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function UserMenu({ onOpenAccounts }: { onOpenAccounts?: () => void }) {
  const { currentUser, logout } = useAuth();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  if (!currentUser) return null;

  const primaryRole = currentUser.roles[0] || 'kinh_doanh';
  const roleMeta = ROLE_META[primaryRole];
  const RoleIcon = roleMeta.icon;

  // Chỉ lấy 2 chữ cái đầu của từ cuối cùng, ví dụ "Nguyễn Quản Trị" -> "QT"
  const initials = currentUser.name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Tài khoản đang đăng nhập"
            className={cn(
              "flex h-9 items-center gap-2 rounded-lg bg-card pl-1.5 pr-2 text-left",
              "transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            )}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/15 text-[10px] font-bold text-accent">
              {initials || <RoleIcon className="h-3.5 w-3.5" />}
            </span>
            <span className="hidden min-w-0 flex-col items-start leading-none lg:flex">
              <span className="max-w-[9rem] truncate text-xs font-semibold text-foreground">
                {currentUser.name}
              </span>
              <span className="mt-0.5 max-w-[9rem] truncate text-[10px] text-muted-foreground">
                {roleMeta.short}
              </span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 border-border bg-popover">
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-3 py-1">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-xs font-bold text-accent">
                {initials || <RoleIcon className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{currentUser.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{currentUser.email}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className={roleChip(primaryRole)}>
                <RoleIcon className="h-3 w-3" />
                {roleMeta.label}
              </span>
              {currentUser.username && (
                <span className="inline-flex shrink-0 items-center rounded-md bg-secondary/60 px-2 py-0.5 font-mono text-[11px] font-medium leading-none text-muted-foreground">
                  @{currentUser.username}
                </span>
              )}
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setIsChangePasswordOpen(true)}>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            Đổi mật khẩu
          </DropdownMenuItem>

          {currentUser.roles.includes("admin") && onOpenAccounts && (
            <DropdownMenuItem onClick={onOpenAccounts}>
              <UserCog className="h-4 w-4 text-muted-foreground" />
              Quản lý tài khoản
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={logout} className="text-danger focus:text-danger">
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangePasswordDialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen} />
    </>
  );
}
