"use client";

import { useDashboardPageHeaderStore } from "@/store/dashboard";
import type { DashboardPageHeaderOverride } from "@/types/dashboard";

/** Current runtime dashboard header override registered by an active page. */
export function useDashboardPageHeaderOverride(): DashboardPageHeaderOverride | null {
  return useDashboardPageHeaderStore((state) => state.entry?.value ?? null);
}
