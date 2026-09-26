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
 * within the last `maxAgeMs` — used by `useAuth` to skip an otherwise-certain
 * revalidation on mount for a hard reload that just happened. Without this,
 * bouncing between the `/login` and `/signup` full pages (a hard nav each
 * time — see `meCacheProvider`'s doc comment) re-fetches `/me` on every
 * single bounce even though nothing about the session could plausibly have
 * changed a few seconds apart. `sessionStorage` is per-tab, so this can never
 * mask a logout that happened in a *different* tab; a logout in *this* tab
 * itself re-persists the now-logged-out state before this could go stale.
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
 * in `useAuth` — also skips the redundant network refetch when the reload
 * happens within `SWR_DEDUPING_INTERVAL_MS` of the last one, without changing
 * caching behavior for any other SWR-backed data in the app.
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
