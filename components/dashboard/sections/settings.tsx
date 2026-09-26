"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { useAuth } from "@/components/auth-context";
import { ROLE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  chip,
  FIELD_BASE,
  LABEL_BASE,
  SECTION_SUBTITLE,
  SECTION_TITLE,
  SURFACE_CARD,
  TONE_SURFACE,
} from "@/lib/ui";
import {
  User,
  Bell,
  Shield,
  Palette,
  Link2,
  Database,
  Mail,
  Smartphone,
  Globe,
  Key,
  RefreshCw,
  Check,
  ExternalLink,
  Zap,
} from "lucide-react";

const integrations = [
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Sync contacts and opportunities",
    connected: true,
    lastSync: "2 hours ago",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Marketing automation and CRM",
    connected: true,
    lastSync: "5 mins ago",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Thông báo và cảnh báo của đội ngũ",
    connected: true,
    lastSync: "Real-time",
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Email tracking and sync",
    connected: false,
    lastSync: null,
  },
  {
    id: "calendar",
    name: "Google Calendar",
    description: "Meeting scheduling",
    connected: false,
    lastSync: null,
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Video conferencing integration",
    connected: true,
    lastSync: "1 hour ago",
  },
];

const notificationSettings = [
  {
    id: "deal_updates",
    label: "Deal Updates",
    description: "Get notified when deals change status",
    email: true,
    push: true,
  },
  {
    id: "team_activity",
    label: "Hoạt động đội ngũ",
    description: "Updates on team performance and milestones",
    email: true,
    push: false,
  },
  {
    id: "pipeline_alerts",
    label: "Cảnh báo quy trình",
    description: "Alerts for pipeline changes and risks",
    email: true,
    push: true,
  },
  {
    id: "forecast_updates",
    label: "Forecast Updates",
    description: "Weekly forecast summary reports",
    email: true,
    push: false,
  },
  {
    id: "customer_health",
    label: "Customer Health",
    description: "Alerts when customer health scores drop",
    email: false,
    push: true,
  },
];

export function SettingsSection() {
  const { currentUser, role } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [notifications, setNotifications] = useState(notificationSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [namePart, ...nameRest] = (currentUser?.name || "").split(" ");
  const roleLabel = ROLE_LABELS[role];
  const isAdmin = role === "admin";

  // Nhân viên chỉ có 2 tab cá nhân; tab Thông báo/Tích hợp là cấu hình hệ thống
  // nên chỉ Admin mới thấy, đồng thời chặn luôn việc mở tab bị ẩn.
  useEffect(() => {
    if (!isAdmin && (activeTab === "notifications" || activeTab === "integrations")) {
      setActiveTab("profile");
    }
  }, [isAdmin, activeTab]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  };

  const toggleNotification = (id: string, type: "email" | "push") => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, [type]: !n[type] } : n))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className={SECTION_TITLE}>{isAdmin ? "Cài đặt" : "Tài khoản của tôi"}</h2>
        <p className={SECTION_SUBTITLE}>
          {isAdmin
            ? "Quản lý tùy chọn tài khoản và các tích hợp"
            : "Cập nhật thông tin cá nhân, tuỳ chọn hiển thị và bảo mật tài khoản"}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary/60 p-1">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-card data-[state=active]:text-foreground"
          >
            <User className="w-4 h-4 mr-2" />
            Hồ sơ
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              <Bell className="w-4 h-4 mr-2" />
              Thông báo
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger
              value="integrations"
              className="data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Tích hợp
            </TabsTrigger>
          )}
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-card data-[state=active]:text-foreground"
          >
            <Shield className="w-4 h-4 mr-2" />
            Bảo mật
          </TabsTrigger>
        </TabsList>

        {/* Hồ sơ Tab */}
        <TabsContent value="profile" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className={SURFACE_CARD}>
            <CardHeader>
              <CardTitle className="text-base font-medium">Thông tin cá nhân</CardTitle>
              <CardDescription>Cập nhật thông tin cá nhân và tùy chọn của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20 bg-secondary">
                  <AvatarFallback className="bg-accent text-accent-foreground text-2xl font-semibold">
                    {(currentUser?.name || "NV")
                      .split(" ")
                      .filter(Boolean)
                      .slice(-2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    Đổi ảnh đại diện
                  </Button>
                  <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className={LABEL_BASE}>Tên</Label>
                  <Input
                    id="firstName"
                    defaultValue={namePart}
                    readOnly
                    className={cn(FIELD_BASE, "bg-secondary")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className={LABEL_BASE}>Họ</Label>
                  <Input
                    id="lastName"
                    defaultValue={nameRest.join(" ")}
                    readOnly
                    className={cn(FIELD_BASE, "bg-secondary")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className={LABEL_BASE}>Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={currentUser?.email || ""}
                    readOnly
                    className={cn(FIELD_BASE, "bg-secondary")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className={LABEL_BASE}>Vai trò</Label>
                  <Input
                    id="role"
                    defaultValue={roleLabel}
                    readOnly
                    className={cn(FIELD_BASE, "bg-secondary")}
                  />
                  <p className={LABEL_BASE}>
                    Tên đăng nhập:{" "}
                    <span className="font-mono">{currentUser?.username || "—"}</span>. Thông tin hồ sơ và
                    vai trò do quản trị viên cập nhật trong mục Quản lý tài khoản.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone" className={LABEL_BASE}>Timezone</Label>
                <Select defaultValue="pst">
                  <SelectTrigger className={cn(FIELD_BASE, "w-full md:w-[300px]")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pst">Pacific Time (PT)</SelectItem>
                    <SelectItem value="mst">Mountain Time (MT)</SelectItem>
                    <SelectItem value="cst">Central Time (CT)</SelectItem>
                    <SelectItem value="est">Eastern Time (ET)</SelectItem>
                    <SelectItem value="utc">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className={SURFACE_CARD}>
            <CardHeader>
              <CardTitle className="text-base font-medium">Display Preferences</CardTitle>
              <CardDescription>Customize how data is displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Chế độ tối</p>
                    <p className="text-sm text-muted-foreground">Use dark theme for the interface</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Currency Format</p>
                    <p className="text-sm text-muted-foreground">Display currency in your locale</p>
                  </div>
                </div>
                <Select defaultValue="usd">
                  <SelectTrigger className={cn(FIELD_BASE, "w-[120px]")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                    <SelectItem value="gbp">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Chế độ xem thu gọn</p>
                    <p className="text-sm text-muted-foreground">Show more data in less space</p>
                  </div>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Thông báo Tab */}
        <TabsContent value="notifications" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className={SURFACE_CARD}>
            <CardHeader>
              <CardTitle className="text-base font-medium">Notification Preferences</CardTitle>
              <CardDescription>Choose how and when you want to be notified</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="grid grid-cols-[1fr,80px,80px] gap-4 pb-3 text-sm text-muted-foreground">
                  <span>Notification Type</span>
                  <span className="text-center flex items-center justify-center gap-1.5">
                    <Mail className="w-4 h-4" />
                    Email
                  </span>
                  <span className="text-center flex items-center justify-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    Push
                  </span>
                </div>
                {notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className="grid grid-cols-[1fr,80px,80px] gap-4 py-4 animate-in fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div>
                      <p className="font-medium text-foreground">{notification.label}</p>
                      <p className="text-sm text-muted-foreground">{notification.description}</p>
                    </div>
                    <div className="flex items-center justify-center">
                      <Switch
                        checked={notification.email}
                        onCheckedChange={() => toggleNotification(notification.id, "email")}
                      />
                    </div>
                    <div className="flex items-center justify-center">
                      <Switch
                        checked={notification.push}
                        onCheckedChange={() => toggleNotification(notification.id, "push")}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tích hợp Tab */}
        <TabsContent value="integrations" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className={SURFACE_CARD}>
            <CardHeader>
              <CardTitle className="text-base font-medium">Đã kết nối Services</CardTitle>
              <CardDescription>Manage your third-party integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map((integration, index) => (
                  <div
                    key={integration.id}
                    className={cn(
                      "p-4 rounded-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2",
                      integration.connected
                        ? "bg-accent/10"
                        : "bg-secondary/40 hover:bg-secondary/60"
                    )}
                    style={{ animationDelay: `${index * 75}ms` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            TONE_SURFACE[integration.connected ? "success" : "neutral"]
                          )}
                        >
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{integration.name}</p>
                          <p className="text-sm text-muted-foreground">{integration.description}</p>
                        </div>
                      </div>
                      <Badge className={chip(integration.connected ? "success" : "neutral")}>
                        {integration.connected ? "Đã kết nối" : "Chưa kết nối"}
                      </Badge>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      {integration.connected ? (
                        <>
                          <span className="text-xs text-muted-foreground">
                            Last sync: {integration.lastSync}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-8">
                              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                              Sync
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 text-danger hover:text-danger">
                              Ngắt kết nối
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-muted-foreground">Not configured</span>
                          <Button
                            size="sm"
                            className="h-8 bg-accent hover:bg-accent/90 text-accent-foreground"
                          >
                            Kết nối
                            <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bảo mật Tab */}
        <TabsContent value="security" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className={SURFACE_CARD}>
            <CardHeader>
              <CardTitle className="text-base font-medium">Mật khẩu &amp; Xác thực</CardTitle>
              <CardDescription>Quản lý bảo mật tài khoản của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Đổi mật khẩu bằng hộp thoại riêng, hệ thống sẽ kiểm tra lại mật khẩu hiện tại và huỷ mọi
                  phiên đăng nhập khác của tài khoản này.
                </p>
                <Button variant="outline" onClick={() => setIsChangePasswordOpen(true)}>
                  <Key className="w-4 h-4 mr-2" />
                  Đổi mật khẩu
                </Button>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Nếu quên mật khẩu, liên hệ quản trị viên để được đặt lại. Mật khẩu mới sẽ được cấp riêng
                  và chỉ hiển thị một lần duy nhất.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className={SURFACE_CARD}>
            <CardHeader>
              <CardTitle className="text-base font-medium">Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", TONE_SURFACE.success)}>
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Authenticator App</p>
                    <p className="text-sm text-muted-foreground">
                      Use an authenticator app for 2FA codes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={chip("success")}>Enabled</Badge>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={SURFACE_CARD}>
            <CardHeader>
              <CardTitle className="text-base font-medium">Active Sessions</CardTitle>
              <CardDescription>Manage devices where you&apos;re signed in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { device: "MacBook Pro", location: "San Francisco, CA", current: true, time: "Now" },
                  { device: "iPhone 15", location: "San Francisco, CA", current: false, time: "2 hours ago" },
                  { device: "Chrome on Windows", location: "New York, NY", current: false, time: "1 day ago" },
                ].map((session, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 animate-in fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${index * 75}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", TONE_SURFACE.neutral)}>
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {session.device}
                          {session.current && (
                            <Badge className={cn("ml-2", chip("accent"))}>
                              Current
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.location} • {session.time}
                        </p>
                      </div>
                    </div>
                    {!session.current && (
                      <Button variant="ghost" size="sm" className="text-danger hover:text-danger">
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ChangePasswordDialog
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
      />
    </div>
  );
}
