import { redirect } from "next/navigation";

/** Route gốc `/` chỉ redirect về Trung tâm đơn hàng (MPA: không còn SPA switch state). */
export default function RootPage() {
  redirect("/don-hang");
}
