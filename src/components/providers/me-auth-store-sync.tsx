"use client";

import { useEffect } from "react";
import { useAuth } from "@/api/hooks/auth";
import { useMeStore } from "@/store/auth";

/**
 * Giữ Zustand `useMeStore` đồng bộ với SWR (`useAuth`).
 * Phải nằm trong `SWRConfig` (ví dụ trong `AppProviders`).
 */
export function MeAuthStoreSync() {
  const { me, isLoading, error, mutate } = useAuth();
  const syncFromUseAuth = useMeStore((s) => s.syncFromUseAuth);

  useEffect(() => {
    syncFromUseAuth({ me, isLoading, error, mutate });
  }, [me, isLoading, error, mutate, syncFromUseAuth]);

  return null;
}
