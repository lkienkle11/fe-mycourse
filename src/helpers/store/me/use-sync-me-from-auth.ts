"use client";

import { useEffect } from "react";
import { useAuth } from "@/api/hooks/auth";
import { useMeStore } from "@/store/auth";

/**
 * Đồng bộ `useMeStore` với SWR `useAuth`.
 * Gọi trong `AppProviders` (phải nằm trong `SWRConfig`).
 */
export function useSyncMeFromAuth(): void {
  const { me, isLoading, error, mutate } = useAuth();
  const syncFromUseAuth = useMeStore((s) => s.syncFromUseAuth);

  useEffect(() => {
    syncFromUseAuth({
      me,
      isLoading,
      error,
      mePermissions: me?.permissions ?? [],
      mutate,
    });
  }, [me, isLoading, error, mutate, syncFromUseAuth]);
}
