"use client";

import { useAuth } from "@/api/hooks/auth";
import { useAuthStore, type AuthStoreState, type MeStoreState } from "@/store/auth";

export function useAuthContext(): AuthStoreState {
  return useAuthStore();
}

export function useGetMe(): MeStoreState {
  const { me, isLoading, error, mutate } = useAuth();
  return { me, isLoading, isError: error, mutateMe: mutate };
}
