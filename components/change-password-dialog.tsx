"use client";

import { useState } from "react";
import { AlertTriangle, KeyRound, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-context";
import { cn } from "@/lib/utils";
import { FIELD_BASE, LABEL_BASE, SURFACE_CARD, TONE_SURFACE } from "@/lib/ui";

const RULES = ["Không được để trống", "Tối đa 128 ký tự"];

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setIsSubmitting(true);
    const success = await changePassword(currentPassword, newPassword);
    setIsSubmitting(false);

    if (success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(SURFACE_CARD, "sm:max-w-md")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={cn("flex h-6 w-6 items-center justify-center rounded-md", TONE_SURFACE.accent)}>
              <KeyRound className="h-4 w-4" />
            </span>
            Đổi mật khẩu
          </DialogTitle>
          <DialogDescription>
            Sau khi đổi mật khẩu, toàn bộ phiên đăng nhập khác của bạn sẽ bị đăng xuất.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="current-password" className={LABEL_BASE}>
              Mật khẩu hiện tại
            </Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className={cn(FIELD_BASE, "bg-secondary")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-password" className={LABEL_BASE}>
              Mật khẩu mới
            </Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className={cn(FIELD_BASE, "bg-secondary")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password" className={LABEL_BASE}>
              Xác nhận mật khẩu mới
            </Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={cn(FIELD_BASE, "bg-secondary")}
            />
          </div>

          <ul className="space-y-1 rounded-lg bg-secondary/50 px-3 py-2.5 text-[11px] text-muted-foreground">
            {RULES.map((rule) => (
              <li key={rule}>• {rule}</li>
            ))}
          </ul>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-xs text-danger"
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Xác nhận đổi mật khẩu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
