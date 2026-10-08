import type { Metadata } from "next";
import { NotificationsPage } from "@/components/dashboard/notifications-page";

export const metadata: Metadata = { title: "Thông báo | PCM Vận Hành" };

export default function ThongBaoPage() {
  return <NotificationsPage />;
}
