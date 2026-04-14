"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAuth } from "@/api/hooks/auth";
import { type MeStoreState, useMeStore } from "@/store/auth";

export { type AuthStoreState, useAuthStore } from "@/store/auth";

export function useGetMe(): MeStoreState {
  return useMeStore(
    useShallow((s) => ({
      me: s.me,
      isLoading: s.isLoading,
      isError: s.isError,
      mePermissions: s.mePermissions,
      mutateMe: s.mutateMe,
    })),
  );
}

/**
 * Đồng bộ `useMeStore` với SWR `useAuth`.
 * Gọi từ `MeSwrSync` trong `AppProviders` — phải nằm trong `SWRConfig` (xem `src/components/providers/app-providers.tsx`).
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
