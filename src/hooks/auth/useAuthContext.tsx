"use client";

import { useShallow } from "zustand/react/shallow";
import { useAuthStore, useMeStore, type AuthStoreState, type MeStoreState } from "@/store/auth";

export function useAuthContext(): AuthStoreState {
  return useAuthStore();
}

export function useGetMe(): MeStoreState {
  return useMeStore(
    useShallow((s) => ({
      me: s.me,
      isLoading: s.isLoading,
      isError: s.isError,
      mutateMe: s.mutateMe,
    })),
  );
}
