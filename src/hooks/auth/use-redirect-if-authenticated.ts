"use client";

import { useEffect, useState } from "react";
import { useGetMe } from "@/hooks/auth/use-auth-store";
import { useRouter } from "@/i18n/navigation";
import { homeHref } from "@/lib/navigation/routes";

type AuthSnapshot = "pending" | "authenticated" | "guest";

/**
 * Redirects away from `/login` / `/signup` when a session already existed
 * *before* this component ever rendered its form — a stale tab, a race with
 * a background navigation, a shared link opened twice. Visiting either page
 * while already authenticated must never keep rendering the form.
 *
 * Snapshots "was authenticated on the first resolved check" once, via
 * React's sanctioned "store info from a previous render" pattern (a
 * `setState` call guarded by a render-time condition, not a ref mutated
 * during render — this repo's `react-hooks/refs` lint rule forbids the
 * latter, see `dashboard-layout.tsx`'s `frozenDenial` for the same pattern),
 * and never re-evaluates after that. A transition from guest to authenticated
 * *while this component stays mounted* is the login/signup this very form
 * just performed — already handled by the caller's own `onAuthenticated`
 * callback (`LoginContent`/`SignupContent`'s `onSubmit`). Reacting to it here
 * too raced that callback: by the time this hook's effect fired, the URL had
 * often already moved on to the real destination (dropping its `next` query
 * param), so `useAuthNextParam()` recomputed `nextPath` as `null` and this
 * hook overwrote the correct redirect with a bounce to `homeHref` instead —
 * caught via a fixture-backed e2e run where a learner's own post-login
 * redirect to `/instructor` got hijacked back to `/` this way.
 */
export function useRedirectIfAuthenticated(nextPath: string | null): boolean {
  const { me, isLoading } = useGetMe();
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<AuthSnapshot>("pending");

  if (snapshot === "pending" && !isLoading) {
    setSnapshot(me ? "authenticated" : "guest");
  }

  useEffect(() => {
    if (snapshot !== "authenticated") return;
    router.replace(nextPath ?? homeHref);
  }, [snapshot, nextPath, router]);

  return snapshot === "authenticated";
}
