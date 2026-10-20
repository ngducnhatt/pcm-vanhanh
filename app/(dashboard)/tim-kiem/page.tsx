"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SearchResults } from "@/components/dashboard/search-results";

function TimKiemInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  return <SearchResults query={query} onClose={() => router.push("/don-hang")} />;
}

export default function TimKiemPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Đang tìm kiếm...</p>}>
      <TimKiemInner />
    </Suspense>
  );
}
