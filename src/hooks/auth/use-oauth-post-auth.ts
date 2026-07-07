"use client";

import { useCallback } from "react";
import { useAuthStore, useGetMe } from "@/hooks/auth/use-auth-store";
import { useRouter } from "@/i18n/navigation";

export function useOAuthPostAuth() {
  const router = useRouter();
  const { closeAllModals, nextLink } = useAuthStore();
  const { mutateMe } = useGetMe();

  return useCallback(() => {
    mutateMe();
    closeAllModals();
    if (nextLink) {
      router.push(nextLink);
    }
  }, [closeAllModals, mutateMe, nextLink, router]);
}
