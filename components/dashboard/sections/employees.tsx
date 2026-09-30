"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Unlock,
  UserPlus,
  Users as UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/auth-context";
import { cn } from "@/lib/utils";
import { Role } from "@/lib/types";
import {
  chip,
  ROLE_META,
  roleLabel,
  SURFACE_CARD,
  SECTION_TITLE,
  SECTION_SUBTITLE,
  TONE_SURFACE,
  type Tone,
} from "@/lib/ui";

interface Account {
  id: string;
  name: string;
  username: string | null;
  email: string;
  phone: string | null;
  roles: Role[];
  is_active: number;
  created_at: string;
  last_login_at?: string | null;
  locked_until?: string | null;
  failed_login_count?: number;
}

interface AuditLog {
  id: string;
  actor_name: string | null;
  action: string;
  target_name: string | null;
  detail: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
}

const ROLES = Object.keys(ROLE_META) as Role[];

const ACTION_LABELS: Record<string, string> = {
  login_success: 'Đăng nhập thành công',
  login_failed: 'Đăng nhập thất bại',
  logout: 'Đăng xuất',
  user_created: 'Tạo tài khoản',
  user_updated: 'Cập nhật tài khoản',
  user_locked: 'Khoá tài khoản',
  user_unlocked: 'Mở khoá tài khoản',
  user_deactivated: 'Vô hiệu hoạt tài khoản',
  user_reactivated: 'Kích hoạt lại tài khoản',
  role_changed: 'Đổi vai trò',
  password_changed: 'Đổi mật khẩu',
  password_reset: 'Đặt lại mật khẩu',
};

/** Tone cho từng loại thao tác trong nhật ký */
const ACTION_TONES: Record<string, Tone> = {
  login_success: 'success',
  login_failed: 'danger',
  password_reset: 'warning',
  password_changed: 'warning',
  user_created: 'neutral',
  user_updated: 'neutral',
  user_unlocked: 'success',
  user_reactivated: 'success',
  user_deactivated: 'neutral',
  role_changed: 'neutral',
  logout: 'neutral',
};

const emptyForm = {
  name: '',
  username: '',
  email: '',
  phone: '',
  roles: ['kinh_doanh'] as Role[],
  password: '',
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z');
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function isLockedNow(account: Account): boolean {
  return Boolean(account.locked_until && new Date(account.locked_until).getTime() > Date.now());
}

/**
 * Mục hợp nhất "Nhân viên & Vai trò" + "Quản lý tài khoản".
 *
 * - Mọi người đã đăng nhập đều xem được danh sách nhân viên và vai trò.
 * - Chỉ Admin có quyền tạo / sửa / khoá tài khoản và xem nhật ký quản trị.
 */
export function EmployeesSection() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.roles?.includes("admin") || false;

  const [tab, setTab] = useState<'accounts' | 'audit'>('accounts');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [tempPassword, setTempPassword] = useState<{ user: string; password: string } | null>(null);

  const loadAccounts = useCallback(async () => {
    // Admin xem được cả tài khoản đã khoá; nhân viên chỉ xem tài khoản đang hoạt động
    const endpoint = isAdmin ? "/api/admin/users" : "/api/users";
    const res = await fetch(endpoint, { cache: "no-store" });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Không tải được danh sách nhân viên");
      return;
    }

    const data = await res.json();
    setAccounts(data.users || []);
  }, [isAdmin]);

  const loadLogs = useCallback(async () => {
    if (!isAdmin) return;
    const res = await fetch("/api/admin/audit-logs?limit=60", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setLogs(data.logs || []);
  }, [isAdmin]);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([loadAccounts(), loadLogs()]);
    setIsLoading(false);
  }, [loadAccounts, loadLogs]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const stats = useMemo(() => {
    const active = accounts.filter((account) => account.is_active === 1).length;
    const locked = accounts.filter((account) => account.is_active === 1 && isLockedNow(account)).length;
    const byRole = ROLES.map((role) => ({
      role,
      label: ROLE_META[role].short,
      count: accounts.filter((account) => (account.roles || []).includes(role)).length,
    })).filter((item) => item.count > 0);
    return { total: accounts.length, active, locked, inactive: accounts.length - active, byRole };
  }, [accounts]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return accounts.filter((account) => {
      const roles = account.roles || [];
      if (roleFilter !== "all" && !roles.includes(roleFilter)) return false;
      if (!term) return true;
      return [account.name, account.username, account.email, account.phone, ...roles.map(roleLabel)]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term));
    });
  }, [accounts, search, roleFilter]);

  const openCreateDialog = () => {
    setFormMode('create');
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (account: Account) => {
    setFormMode('edit');
    setEditingId(account.id);
    setForm({
      name: account.name,
      username: account.username || '',
      email: account.email,
      phone: account.phone || '',
      roles: account.roles || [],
      password: '',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving) return;

    // Client-side validation: phone is required, email is optional
    if (!form.phone.trim()) {
      setFormError('Vui lòng nhập số điện thoại');
      return;
    }

    setFormError(null);
    setIsSaving(true);

    try {
      const creating = formMode === 'create';
      const url = creating ? "/api/admin/users" : `/api/admin/users/${editingId}`;
      const body = creating
        ? {
            name: form.name.trim(),
            username: form.username.trim().toLowerCase(),
            email: form.email.trim() || null,
            phone: form.phone.trim(),
            roles: form.roles,
            // Empty password -> the API generates a random one
            password: form.password ? form.password : null,
          }
        : {
            name: form.name.trim(),
            username: form.username.trim().toLowerCase(),
            email: form.email.trim() || null,
            phone: form.phone.trim(),
            roles: form.roles,
          };

      const res = await fetch(url, {
        method: creating ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFormError(data.error || "Không lưu được tài khoản");
        return;
      }

      if (data.temporaryPassword) {
        setTempPassword({ user: data.user?.name || form.name, password: data.temporaryPassword });
      }

      toast.success(creating ? "Đã tạo tài khoản" : "Đã cập nhật tài khoản");
      setIsFormOpen(false);
      await loadAll();
    } finally {
      setIsSaving(false);
    }
  };

  const patchAccount = async (account: Account, patch: Record<string, unknown>, successMessage: string) => {
    setBusyId(account.id);
    try {
      const res = await fetch(`/api/admin/users/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Thao tác thất bại");
        return;
      }

      toast.success(successMessage);
      await loadAll();
    } finally {
      setBusyId(null);
    }
  };

  const resetPassword = async (account: Account) => {
    const confirmed = window.confirm(
      `Đặt lại mật khẩu cho "${account.name}"?\n\nMọi phiên đăng nhập hiện tại của tài khoản này sẽ bị đăng xuất.`
    );
    if (!confirmed) return;

    setBusyId(account.id);
    try {
      const res = await fetch(`/api/admin/users/${account.id}/reset-password`, { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || "Không đặt lại được mật khẩu");
        return;
      }

      if (data.temporaryPassword) {
        setTempPassword({ user: account.name, password: data.temporaryPassword });
      }
      toast.success(data.message || "Đã đặt lại mật khẩu");
      await loadAll();
    } finally {
      setBusyId(null);
    }
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Đã sao chép");
    } catch {
      toast.error("Trình duyệt không cho phép sao chép");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={SECTION_TITLE}>Nhân viên &amp; Vai trò</h2>
          <p className={SECTION_SUBTITLE}>
            {isAdmin
              ? "Danh sách nhân viên, tài khoản đăng nhập và quyền truy cập theo vai trò."
              : "Danh sách nhân viên và vai trò trong cửa hàng."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadAll} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Làm mới
          </Button>
          {isAdmin && (
            <Button size="sm" onClick={openCreateDialog}>
              <UserPlus className="h-4 w-4" />
              Tạo tài khoản
            </Button>
          )}
        </div>
      </div>

      {/* Thống kê nhân sự theo vai trò */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={UsersIcon} tone="accent" label="Tổng nhân viên" value={stats.total} />
        <StatCard icon={Check} tone="success" label="Đang hoạt động" value={stats.active} />
        <StatCard
          icon={Ban}
          tone="neutral"
          label={isAdmin ? "Vô hiệu hoạt" : "Đã từng đăng nhập"}
          value={isAdmin ? stats.inactive : accounts.filter((a) => a.last_login_at).length}
        />
        <StatCard
          icon={AlertTriangle}
          tone={isAdmin ? "danger" : "neutral"}
          label={isAdmin ? "Đang bị khoá" : "Quản trị viên"}
          value={isAdmin ? stats.locked : accounts.filter((a) => (a.roles || []).includes("admin")).length}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-lg bg-card p-1">
        <TabButton active={tab === "accounts"} onClick={() => setTab("accounts")} icon={UsersIcon}>
          Danh sách nhân viên ({accounts.length})
        </TabButton>
        {isAdmin && (
          <TabButton active={tab === "audit"} onClick={() => setTab("audit")} icon={ShieldCheck}>
            Nhật ký đăng nhập &amp; quản trị
          </TabButton>
        )}
      </div>

      {tab === "accounts" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo tên, tên đăng nhập, email..."
                className="h-9 bg-card pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as Role | "all")}>
              <SelectTrigger className="h-9 w-[200px] bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_META[role].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phân bổ theo vai trò */}
          <div className="flex flex-wrap gap-1.5">
            {stats.byRole.map(({ role, label, count }) => {
              const RoleIcon = ROLE_META[role].icon;
              const selected = roleFilter === role;
              return (
                <button
                  key={role}
                  onClick={() => setRoleFilter((current) => (current === role ? "all" : role))}
                  aria-pressed={selected}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                    selected
                      ? "bg-accent/15 text-accent"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <RoleIcon className="h-3 w-3" />
                  {label} · {count}
                </button>
              );
            })}
          </div>

          <div className="overflow-x-auto rounded-xl bg-card">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="bg-secondary/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Nhân viên</th>
                  <th className="px-4 py-3 font-medium">Tên đăng nhập</th>
                  <th className="px-4 py-3 font-medium">Vai trò</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium">Đăng nhập gần nhất</th>
                  {isAdmin && <th className="px-4 py-3 text-right font-medium">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-4 py-10 text-center text-xs text-muted-foreground">
                      Không tìm thấy nhân viên nào
                    </td>
                  </tr>
                )}
                {filtered.map((account) => {
                  const locked = isLockedNow(account);
                  const isSelf = account.id === currentUser?.id;

                  return (
                    <tr key={account.id} className="transition-colors hover:bg-secondary/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                              account.is_active ? "bg-secondary text-secondary-foreground" : "bg-secondary/50 text-muted-foreground"
                            )}
                          >
                            {account.name
                              .trim()
                              .split(/\s+/)
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground">
                              {account.name}
                              {isSelf && <span className="ml-1.5 text-[10px] text-muted-foreground">(bạn)</span>}
                            </div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              {account.phone}
                              {account.email ? ` · ${account.email}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">
                        {account.username || <span className="text-muted-foreground">chưa cấp</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          {(account.roles || []).map((role) => {
                            const RoleIcon = ROLE_META[role].icon;
                            return (
                              <span key={role} className={chip('neutral')}>
                                <RoleIcon className="h-3 w-3" />
                                {roleLabel(role, true)}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {account.is_active !== 1 ? (
                          <span className={chip('neutral')}>Đã vô hiệu hoạt</span>
                        ) : locked ? (
                          <span className={chip('danger')}>Đang khoá</span>
                        ) : (
                          <span className={chip('success')}>Hoạt động</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-muted-foreground">
                        {formatDateTime(account.last_login_at)}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Sửa hồ sơ & vai trò"
                              onClick={() => openEditDialog(account)}
                              disabled={busyId === account.id}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Đặt lại mật khẩu"
                              onClick={() => resetPassword(account)}
                              disabled={busyId === account.id}
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                            </Button>
                            {locked && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Mở khoá tài khoản"
                                onClick={() => patchAccount(account, { unlock: true }, 'Đã mở khoá tài khoản')}
                                disabled={busyId === account.id}
                              >
                                <Unlock className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title={account.is_active ? "Vô hiệu hoạt" : "Kích hoạt lại"}
                              onClick={() =>
                                patchAccount(
                                  account,
                                  { is_active: !account.is_active },
                                  account.is_active
                                    ? 'Đã vô hiệu hoạt tài khoản'
                                    : 'Đã kích hoạt lại tài khoản'
                                )
                              }
                              disabled={isSelf || busyId === account.id}
                            >
                              {account.is_active ? (
                                <Ban className="h-3.5 w-3.5 text-danger" />
                              ) : (
                                <Check className="h-3.5 w-3.5 text-success" />
                              )}
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {isAdmin && (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3" />
              Bạn không thể tự vô hiệu hoạt hoặc tự hạ quyền tài khoản của chính mình. Hệ thống luôn giữ ít nhất
              1 tài khoản Admin hoạt động.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-card">
          <div className="divide-y divide-border/50">
            {logs.length === 0 && (
              <p className="px-4 py-10 text-center text-xs text-muted-foreground">
                Chưa có hoạt động nào được ghi nhận
              </p>
            )}
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                <span className={chip(ACTION_TONES[log.action] ?? 'neutral')}>
                  {ACTION_LABELS[log.action] || log.action}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground">
                    <span className="font-medium">{log.actor_name || 'Hệ thống'}</span>
                    {log.target_name && log.target_name !== log.actor_name && <> → {log.target_name}</>}
                  </p>
                  {log.detail && Object.keys(log.detail).length > 0 && (
                    <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                      {JSON.stringify(log.detail)}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {log.ip ? `${log.ip} · ` : ''}
                  {formatDateTime(log.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tạo / sửa tài khoản — chỉ Admin */}
      {isAdmin && (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="bg-card sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {formMode === 'create' ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                {formMode === 'create' ? 'Tạo tài khoản mới' : 'Cập nhật tài khoản'}
              </DialogTitle>
              <DialogDescription>
                {formMode === 'create'
                  ? 'Bỏ trống mật khẩu để hệ thống tự sinh một mật khẩu ngẫu nhiên, hiển thị đúng 1 lần sau khi tạo.'
                  : 'Thay đổi tên đăng nhập hoặc hạ vai trò sẽ buộc tài khoản đăng nhập lại.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="account-name" className="text-xs">Họ và tên *</Label>
                  <Input
                    id="account-name"
                    required
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="bg-secondary"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="account-username" className="text-xs">Tên đăng nhập *</Label>
                  <Input
                    id="account-username"
                    required
                    pattern="[a-z0-9._\-]+"
                    value={form.username}
                    onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
                    className="bg-secondary font-mono"
                    placeholder="nguyenvana"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="account-email" className="text-xs">Email</Label>
                  <Input
                    id="account-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                    className="bg-secondary"
                    placeholder="ten@pcshop.vn"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="account-phone" className="text-xs">Số điện thoại *</Label>
                  <Input
                    id="account-phone"
                    required
                    value={form.phone}
                    onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                    className="bg-secondary"
                    placeholder="0901 234 567"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Vai trò * (chọn nhiều)</Label>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map((role) => {
                      const isSelected = form.roles.includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              roles: isSelected
                                ? prev.roles.filter((r) => r !== role)
                                : [...prev.roles, role],
                            }));
                          }}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                            isSelected
                              ? "bg-accent text-accent-foreground"
                              : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                          )}
                        >
                          {ROLE_META[role].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {formMode === 'create' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="account-password" className="text-xs">Mật khẩu (tuỳ chọn)</Label>
                    <Input
                      id="account-password"
                      type="text"
                      value={form.password}
                      onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                      className="bg-secondary"
                      placeholder="Để trống = tự sinh"
                    />
                  </div>
                )}
              </div>

              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-xs text-danger"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
                  Huỷ
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {formMode === 'create' ? 'Tạo tài khoản' : 'Lưu thay đổi'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Mật khẩu khởi tạo - hiển thị đúng 1 lần */}
      <Dialog open={Boolean(tempPassword)} onOpenChange={(open) => !open && setTempPassword(null)}>
        <DialogContent className="bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mật khẩu khởi tạo</DialogTitle>
            <DialogDescription>
              Mật khẩu này chỉ hiển thị 1 lần cho <strong>{tempPassword?.user}</strong>. Hãy gửi riêng cho nhân
              viên, nhân viên có thể tự đổi bất cứ lúc nào trong menu tài khoản.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2.5">
            <code className="flex-1 select-all font-mono text-sm text-warning">
              {tempPassword?.password}
            </code>
            <Button
              variant="ghost"
              size="icon-sm"
              title="Sao chép"
              onClick={() => tempPassword && copyToClipboard(tempPassword.password)}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>

          <DialogFooter>
            <Button onClick={() => setTempPassword(null)}>Đã lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: React.ElementType;
  tone: Tone;
  label: string;
  value: number;
}) {
  return (
    <div className={cn(SURFACE_CARD, "p-3.5")}>
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", TONE_SURFACE[tone])}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs leading-tight text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-accent/15 text-accent" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}
