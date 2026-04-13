"use client";

import { useShallow } from "zustand/react/shallow";
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
