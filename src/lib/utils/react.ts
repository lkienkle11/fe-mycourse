import { useId } from "react";

/**
 * Chuỗi id ổn định theo instance (hydration-safe) cho DOM/SVG/A11y.
 * Kết hợp `useId` với hậu tố xác định (FNV-1a) để giảm trùng giữa nhiều phần tử;
 * không dùng `Math.random()` trong render (tránh lệch SSR ↔ client).
 */
export function useUniqueId(prefix = "id"): string {
  const base = useId().replace(/:/g, "");
  let h = 2166136261;
  for (let i = 0; i < base.length; i += 1) {
    h ^= base.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const noise = (h >>> 0).toString(36);
  return `${prefix}-${base}-${noise}`;
}
