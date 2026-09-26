"use client";

import { useCallback } from "react";
import { useGetMe } from "@/hooks/auth/use-auth-store";
import { homeHref } from "@/lib/navigation/routes";

/**
 * Shared post-OAuth side effect: refresh the session, then hand the
 * validated post-login/signup destination to the caller (a modal closes
 * itself and navigates; a full page just navigates).
 *
 * Takes `nextPath` from the caller rather than calling `useAuthNextParam()`
 * itself - every current caller (`LoginContent`, `SignupContent`) already
 * calls it once for its own needs (the form-switch link), and a second,
 * independent call here would run that hook's URL-param read and its
 * "strip an unsafe value" cleanup effect a second time for the same page.
 */
export function useOAuthPostAuth(
  nextPath: string | null,
  onAuthenticated: (destination: string) => void,
) {
  const { mutateMe } = useGetMe();

  return useCallback(() => {
    mutateMe();
    onAuthenticated(nextPath ?? homeHref);
  }, [mutateMe, nextPath, onAuthenticated]);
}
