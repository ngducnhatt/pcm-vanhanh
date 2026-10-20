"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { useAuth } from "@/components/auth-context";
import { cn } from "@/lib/utils";
import {
  chip,
  FIELD_BASE,
  LABEL_BASE,
  ROLE_META,
  roleChip,
  SURFACE_CARD,
} from "@/lib/ui";
import {
  User,
  Shield,
  Key,
  RefreshCw,
  Check,
} from "lucide-react";

export function SettingsSection() {
  const { currentUser, roles } = useAuth();
  const role = roles[0] ?? currentUser?.roles?.[0];
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [namePart, ...nameRest] = (currentUser?.name || "").split(" ");
  const roleLabel = role && role in ROLE_META ? ROLE_META[role].label : "—";

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary/60 p-1">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-card data-[state=active]:text-foreground"
          >
            <User className="w-4 h-4 mr-2" />
            Hồ sơ
          </TabsTrigger>
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
                  <div>
                    {role && role in ROLE_META ? (
                      <span className={roleChip(role)}>
                        {(() => {
                          const Icon = ROLE_META[role].icon;
                          return <Icon className="h-3 w-3" />;
                        })()}
                        {roleLabel}
                      </span>
                    ) : (
                      <span className={chip("neutral")}>—</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="font-semibold"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Bảo mật Tab */}
        <TabsContent value="security" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className={SURFACE_CARD}>
            <CardHeader>
              <CardTitle className="text-base font-medium">Mật khẩu &amp; Xác thực</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button variant="outline" onClick={() => setIsChangePasswordOpen(true)}>
                  <Key className="w-4 h-4" />
                  Đổi mật khẩu
                </Button>
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
