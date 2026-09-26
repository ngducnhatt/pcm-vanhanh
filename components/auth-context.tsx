"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthUser, Role } from "@/lib/types";
import { toast } from "sonner";

interface AuthContextType {
  currentUser: AuthUser | null;
  role: Role;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });

      if (res.status === 401) {
        setCurrentUser(null);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user ?? null);
      }
    } catch (err) {
      console.error("Failed to load current auth user:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuth();
  }, [fetchAuth]);

  const login = async (username: string, password: string): Promise<boolean> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast.error(data.error || "Đăng nhập thất bại");
      return false;
    }

    setCurrentUser(data.user);
    router.refresh();
    return true;
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/me", { method: "POST" });
    } catch {
      // ignore network error: the cookie is cleared either way
    }
    setCurrentUser(null);
    router.push("/login");
    router.refresh();
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast.error(data.error || "Không thể đổi mật khẩu");
      return false;
    }
    toast.success(data.message || "Đổi mật khẩu thành công");
    await fetchAuth();
    return true;
  };

  const role: Role = currentUser?.role || "kinh_doanh";

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isLoading,
        isAuthenticated: Boolean(currentUser),
        login,
        logout,
        changePassword,
        refreshAuth: fetchAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
