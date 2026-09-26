"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { AUTH_NEXT_QUERY_PARAM } from "@/constants/route";
import {
  isAuthRoutePath,
  isSafeInternalPath,
} from "@/lib/security/web/safe-redirect";

/**
 * Reads and validates the `next` query param on `/login` and `/signup`. An
 * unsafe value, or one that is itself `/login`/`/signup` (self-reference),
 * resolves to `null` and is never used for navigation.
 */
export function useAuthNextParam() {
  const searchParams = useSearchParams();

  const rawNextPath = searchParams?.get(AUTH_NEXT_QUERY_PARAM) ?? null;
  const nextPath =
    isSafeInternalPath(rawNextPath) && !isAuthRoutePath(rawNextPath)
      ? rawNextPath
      : null;

  useEffect(() => {
    if (!rawNextPath || nextPath || typeof window === "undefined") return;
    // Rewrites the address bar directly (bypassing the Next.js router) to
    // drop the invalid `next` value. Going through `router.replace` here -
    // even to the exact same pathname, just without the query - is a SOFT
    // navigation, and Next's `@modal` intercepting-route convention treats
    // any soft navigation landing back on `/login`/`/signup` as "entering the
    // route from elsewhere", popping the modal open on top of the very page
    // that is already rendering it (a hard-loaded `/login?next=<invalid>`
    // would show the login form doubled - once as the full page, once as an
    // unwanted modal over it). The raw History API updates the URL bar
    // without going through that interception logic at all.
    const url = new URL(window.location.href);
    url.searchParams.delete(AUTH_NEXT_QUERY_PARAM);
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [nextPath, rawNextPath]);

  return { nextPath, rawNextPath };
}
