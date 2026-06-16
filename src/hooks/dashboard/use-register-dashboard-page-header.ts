"use client";

import { useEffect, useRef } from "react";

import { useDashboardPageHeaderStore } from "@/store/dashboard";
import type { DashboardPageHeaderOverride } from "@/types/dashboard";

/**
 * Registers a runtime dashboard page-header override while the caller is mounted.
 * Unregisters on unmount or when `override` becomes null for the same registration id.
 */
export function useRegisterDashboardPageHeader(
  override: DashboardPageHeaderOverride | null,
): void {
  const idRef = useRef(Symbol("dashboard-page-header"));
  const setOverride = useDashboardPageHeaderStore((state) => state.setOverride);

  useEffect(() => {
    const currentId = idRef.current;

    setOverride(currentId, override);

    return () => {
      setOverride(currentId, null);
    };
  }, [override, setOverride]);
}
