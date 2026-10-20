"use client";

import { useEffect, useState } from "react";

/**
 * Trả về giá trị chỉ cập nhật sau khi người dùng ngừng thay đổi `delay` ms.
 * Dùng cho ô tìm kiếm để không gọi API ở mỗi phím bấm.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
