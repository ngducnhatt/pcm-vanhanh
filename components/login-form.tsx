"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Cpu, Eye, EyeOff, Loader2, Lock, User2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { cn } from "@/lib/utils";
import { FIELD_BASE, LABEL_BASE, SURFACE_CARD } from "@/lib/ui";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = searchParams.get("next") || "/";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    const success = await login(username.trim(), password);
    setIsSubmitting(false);

    if (success) {
      router.replace(nextPath.startsWith("/") ? nextPath : "/");
    } else {
      setError("Thông tin đăng nhập không hợp lệ. Vui lòng kiểm tra lại.");
      setPassword("");
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg">
          <Cpu className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-foreground">PCM Vận Hành</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Quản lý vận hành cửa hàng linh kiện máy tính
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className={cn(SURFACE_CARD, "space-y-4 p-6 shadow-xl shadow-black/20")}
      >
        <div className="space-y-1.5">
          <label htmlFor="username" className={LABEL_BASE}>
            Tên đăng nhập
          </label>
          <div className="relative">
            <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              autoFocus
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="vd: admin"
              className={cn(FIELD_BASE, "h-10 pl-9")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className={LABEL_BASE}>
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className={cn(FIELD_BASE, "h-10 pl-9 pr-10")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-xs text-danger"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground transition-all",
            "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
            isSubmitting && "cursor-not-allowed opacity-70"
          )}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <p className="pt-1 text-center text-[11px] leading-relaxed text-muted-foreground/80">
          Không có tài khoản? Liên hệ quản trị viên để được cấp tài khoản.
          <br />
          Quên mật khẩu? Quản trị viên có thể đặt lại mật khẩu cho bạn.
        </p>
      </form>
    </div>
  );
}
