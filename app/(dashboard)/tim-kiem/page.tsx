"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SearchResults } from "@/components/dashboard/search-results";

function TimKiemInner() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  return <SearchResults query={query} onClose={() => window.history.back()} />;
}

export default function TimKiemPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Đang tìm kiếm...</p>}>
      <TimKiemInner />
      <div className="mt-4">
        <Link href="/don-hang" className="text-sm text-accent hover:underline">
          ← Về Trung tâm đơn hàng
        </Link>
      </div>
    </Suspense>
  );
}
