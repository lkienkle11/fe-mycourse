"use client";

import type { Cache, State } from "swr";
import { getMeEndpointKey } from "@/api/callers/auth";

const ME_CACHE_STORAGE_KEY = "swr-me-cache";

function readPersistedMeCache(): State | null {
  try {
    const raw = sessionStorage.getItem(ME_CACHE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: State = JSON.parse(raw);
    if (parsed?.data === undefined || parsed.error) return null;
    return parsed;
  } catch {
    return null;
  }
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
 * Persisting only this one key removes that flash: the previous `me` paints
 * instantly on the next mount, while `useAuth`'s default `revalidateOnMount`
 * still fires a real request right behind it to confirm the session is still
 * valid — this does not skip that check. (An earlier version also skipped the
 * on-mount refetch entirely when this cache was written less than
 * `SWR_DEDUPING_INTERVAL_MS` ago, to avoid a redundant network call on a fast
 * bounce between `/login` and `/signup`. That let a revoked/expired session
 * survive a reload for that whole window, which
 * `e2e/tests/auth.spec.ts`'s "an expired/revoked session logs the user out on
 * the next check" caught. Removed for that reason — the extra request on a
 * bounce is the correct, safer trade-off.)
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
  if (persisted) cache.set(meKey, persisted);

  window.addEventListener("beforeunload", () => {
    try {
      const state = cache.get(meKey);
      if (!state || state.data === undefined) {
        sessionStorage.removeItem(ME_CACHE_STORAGE_KEY);
      } else {
        sessionStorage.setItem(ME_CACHE_STORAGE_KEY, JSON.stringify(state));
      }
    } catch {
      // Storage full/unavailable (private mode) - fine to lose the persisted cache.
    }
  });

  return cache;
}
