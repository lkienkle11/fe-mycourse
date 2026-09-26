"use client";

import { useEffect } from "react";
import { useGetMe } from "@/hooks/auth/use-auth-store";
import { useRouter } from "@/i18n/navigation";
import { homeHref } from "@/lib/navigation/routes";

/**
 * Redirects away from `/login` / `/signup` when a session already exists —
 * visiting either page while authenticated (a stale tab, a race with a
 * background navigation, a shared link opened twice) must never keep
 * rendering the form. Returns whether a redirect is in flight, so the caller
 * can render nothing instead of a login/signup form for one frame.
 */
export function useRedirectIfAuthenticated(nextPath: string | null): boolean {
  const { me } = useGetMe();
  const router = useRouter();

  useEffect(() => {
    if (!me) return;
    router.replace(nextPath ?? homeHref);
  }, [me, nextPath, router]);

  return !!me;
}
