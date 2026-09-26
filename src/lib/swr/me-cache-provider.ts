"use client";

import type { Cache, State } from "swr";
import { getMeEndpointKey } from "@/api/callers/auth";

const ME_CACHE_STORAGE_KEY = "swr-me-cache";

type PersistedMeCache = {
  state: State;
  /** `Date.now()` at the time this was written — see `isMeCacheFresh`. */
  persistedAt: number;
};

function readPersistedMeCache(): PersistedMeCache | null {
  try {
    const raw = sessionStorage.getItem(ME_CACHE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: PersistedMeCache = JSON.parse(raw);
    if (
      parsed?.state?.data === undefined ||
      parsed.state.error ||
      typeof parsed.persistedAt !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * True when the persisted `/me` cache (see `meCacheProvider`) was written
 * within the last `maxAgeMs`. `useAuth` uses this to skip an otherwise-certain
 * revalidation on mount, but **only** while the current route is `/login` or
 * `/signup` (`isAuthRoutePath`) — never for any other route. That scoping is
 * the whole safety story: skipping this check on a protected route (e.g. a
 * reload of `/instructor`) would let a revoked/expired session survive
 * undetected for the whole window (confirmed via `e2e/tests/auth.spec.ts`'s
 * "an expired/revoked session logs the user out on the next check" — that
 * failed the first time this optimization existed, before it was scoped to
 * the login/signup routes only). Scoped this way, the only thing it can ever
 * delay detecting is a session that's revoked *while the visitor is already
 * sitting on the login/signup page itself* — a page that shows no
 * permission-gated content and, if authenticated, only redirects onward
 * (`useRedirectIfAuthenticated`) once already confirmed. `sessionStorage` is
 * per-tab, so this can never mask a logout that happened in a *different*
 * tab, and a logout in *this* tab re-persists the logged-out state before
 * this could go stale.
 */
export function isMeCacheFresh(maxAgeMs: number): boolean {
  const persisted = readPersistedMeCache();
  if (!persisted) return false;
  return Date.now() - persisted.persistedAt < maxAgeMs;
}

/**
 * SWR cache provider for `AppProviders`' `SWRConfig`. Behaves exactly like
 * SWR's default in-memory `Map` for every key except the current-user `/me`
 * endpoint (`getMeEndpointKey`), which is also persisted to `sessionStorage`.
 *
 * Why: `/login` and `/signup`'s full-page cross-link forces a hard navigation
 * between them (`LoginContent`/`SignupContent`'s `variant="page"` — a soft nav
 * there gets intercepted by the `@modal` route as a modal stacked on the page
 * it targets). A hard navigation tears down the whole JS runtime, including
 * SWR's in-memory cache, so every such reload re-fetched `/me` from scratch
 * and briefly rendered the header as "logged out" until it resolved.
 * Persisting only this one key removes that flash (the previous `me` shows
 * instantly), and — paired with `isMeCacheFresh` gating `revalidateOnMount`
 * in `useAuth`, but **only** on `/login`/`/signup` — also skips the redundant
 * network call on a fast bounce between those two pages specifically,
 * without weakening detection anywhere else in the app.
 *
 * `browserCache` is a client-only singleton: `SWRConfig` re-invokes its
 * `provider` factory every time it remounts (a `useRef` guard, reset on
 * unmount) — notably on every React Fast Refresh that can't preserve
 * `AppProviders`' state, which happens repeatedly across a long dev session.
 * Without this guard, each remount registered another `beforeunload`
 * listener that was never removed, leaking one per remount for the tab's
 * whole lifetime. Scoped to the browser only: on the server this module stays
 * loaded across requests, so a server-side singleton would leak one user's
 * `/me` data into another user's SSR render — every server call gets its own
 * fresh, empty `Map`, matching SWR's own default (no custom provider) there.
 */
let browserCache: Cache | null = null;

export function meCacheProvider(): Cache {
  if (typeof window === "undefined" || !getMeEndpointKey) {
    return new Map<string, State>();
  }
  if (browserCache) return browserCache;

  const cache = new Map<string, State>();
  browserCache = cache;
  const meKey = getMeEndpointKey;

  const persisted = readPersistedMeCache();
  if (persisted) cache.set(meKey, persisted.state);

  window.addEventListener("beforeunload", () => {
    try {
      const state = cache.get(meKey);
      if (!state || state.data === undefined) {
        sessionStorage.removeItem(ME_CACHE_STORAGE_KEY);
      } else {
        const payload: PersistedMeCache = { state, persistedAt: Date.now() };
        sessionStorage.setItem(ME_CACHE_STORAGE_KEY, JSON.stringify(payload));
      }
    } catch {
      // Storage full/unavailable (private mode) - fine to lose the persisted cache.
    }
  });

  return cache;
}
