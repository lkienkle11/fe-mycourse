"use client";

import { useEffect, useRef } from "react";
import { useAuthNextParam } from "@/hooks/auth/use-auth-next-param";
import { usePathname, useRouter } from "@/i18n/navigation";
import { loginHref, signupHref } from "@/lib/navigation/routes";
import { isAuthRoutePath } from "@/lib/security/web/safe-redirect";

type BouncePhase = "idle" | "awaiting-background" | "done";

/**
 * Pure decision extracted for unit testing without a real routing context:
 * only bounce when the current route is `/login`/`/signup`, `next` is
 * present, and `next` is itself NOT `/login` or `/signup` (self-reference,
 * or pointing at the other auth route) - the second effect below waits for
 * `pathname` to leave that same set before reopening the modal, so bouncing
 * to either would never resolve.
 */
export function shouldBounceToBackground(
  pathname: string | null,
  nextPath: string | null,
): nextPath is string {
  return isAuthRoutePath(pathname) && !!nextPath && !isAuthRoutePath(nextPath);
}

/**
 * Bridges the gap between Next.js intercepting routes (which only intercept
 * SOFT navigations) and a hard load of the `/login` or `/signup` fallback
 * page - a direct URL, a browser refresh, or a shared link. A hard load
 * renders the plain full page (no dimmed backdrop, no page behind it),
 * because the `@modal` parallel route slot's `(.)login`/`(.)signup`
 * intercepting convention never engages for a hard navigation.
 *
 * On the very first effect run after mount, if the current route is
 * `/login`/`/signup` with a validated `next` path, this "bounces": it first
 * soft-navigates to `next` (`router.replace`) so that page's real content
 * renders, then - only once `pathname` confirms that navigation has actually
 * landed (not on a timer or animation frame, which can race ahead of a slow
 * RSC fetch/compile and fire before the replace really committed) -
 * soft-navigates back to the login/signup destination (`router.push`).
 * Next.js DOES intercept that second navigation as a modal, since it is a
 * soft navigation away from a page that has now genuinely rendered. Net
 * effect: the modal opens over its real background page even after a hard
 * refresh, matching the intercepted-modal experience.
 *
 * Security: `next` is read through `useAuthNextParam()`, which only ever
 * returns a same-origin internal path (`isSafeInternalPath`) - this never
 * bounces to an external/cross-origin URL.
 *
 * Mounted once, globally, in `AppProviders` (via `AuthModalBackgroundBridge`)
 * so it survives every later soft navigation and only ever runs its bounce
 * once per hard page load. Any future route-modal-with-`next` feature can
 * follow this same pattern.
 */
export function useAuthModalBackgroundBridge() {
  const pathname = usePathname();
  const router = useRouter();
  const { nextPath } = useAuthNextParam();
  const startedRef = useRef(false);
  const phaseRef = useRef<BouncePhase>("idle");
  const modalHrefRef = useRef<string | null>(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!shouldBounceToBackground(pathname, nextPath)) return;

    modalHrefRef.current =
      pathname === "/login" ? loginHref(nextPath) : signupHref(nextPath);
    phaseRef.current = "awaiting-background";
    router.replace(nextPath);
  }, [pathname, nextPath, router]);

  useEffect(() => {
    if (phaseRef.current !== "awaiting-background" || !modalHrefRef.current) {
      return;
    }
    // Wait until the background navigation has actually landed (`pathname`
    // no longer the login/signup destination) before reopening the modal.
    // This effect simply re-runs, doing nothing, on every render until that
    // is true - see the function doc comment for why a timer/animation
    // frame is not used here instead.
    if (isAuthRoutePath(pathname)) return;
    phaseRef.current = "done";
    router.push(modalHrefRef.current);
  }, [pathname, router]);
}
