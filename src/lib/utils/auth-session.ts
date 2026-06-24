import "server-only";

import { cookies } from "next/headers";
import { parseMaxAgeForCookie } from "@/api/axios-helpers";
import { buildAuthCookieOptions, getCookieDomain } from "./cookie";

/**
 * HttpOnly cookie — absolute session expiry (Unix seconds).
 * FE-only, never sent to BE. Used when SSR refresh cannot read Set-Cookie headers.
 * Stores expiry, not relative Max-Age, so non-remember sessions cannot be extended
 * on fallback (BE uses remaining lifetime, not a renewed cap).
 */
export const AUTH_SESSION_EXPIRES_AT_COOKIE = "auth_session_expires_at";

/** Legacy cookie name (relative Max-Age) — cleared on read/write for migration. */
const LEGACY_AUTH_SESSION_MAX_AGE_COOKIE = "auth_session_max_age";

/** Reject bogus values (e.g. legacy relative seconds stored as "expiry"). */
const MIN_VALID_EXPIRES_AT_UNIX = 1_577_836_800; // 2020-01-01 UTC

export interface ResolveRefreshMaxAgeFromBeInput {
  /** Parsed from BE Set-Cookie refresh_token (preferred). */
  refreshMaxAge?: number;
  /** Absolute expiry (Unix seconds) from a prior BE-derived write. */
  storedExpiresAt?: number;
}

/** Seconds remaining until an absolute expiry; undefined when expired or invalid. */
export function remainingSecondsUntilExpiresAt(
  expiresAtUnix: number,
): number | undefined {
  const remaining = Math.floor(expiresAtUnix - Date.now() / 1000);
  return remaining > 0 ? remaining : undefined;
}

/** Anchor absolute expiry from a fresh BE Set-Cookie Max-Age. */
export function expiresAtFromMaxAge(maxAgeSeconds: number): number {
  return Math.floor(Date.now() / 1000) + maxAgeSeconds;
}

/**
 * Resolve refresh/session cookie Max-Age entirely from BE signals — no hardcoded TTL.
 * Priority: fresh Set-Cookie Max-Age → remaining time until auth_session_expires_at.
 */
export function resolveRefreshMaxAgeFromBe({
  refreshMaxAge,
  storedExpiresAt,
}: ResolveRefreshMaxAgeFromBeInput): number | undefined {
  if (refreshMaxAge !== undefined && refreshMaxAge > 0) {
    return refreshMaxAge;
  }
  if (storedExpiresAt !== undefined) {
    return remainingSecondsUntilExpiresAt(storedExpiresAt);
  }
  return undefined;
}

/** Parse refresh_token Max-Age from raw BE Set-Cookie header(s). */
export function refreshMaxAgeFromBeSetCookie(
  setCookieHeaders: string | string[] | undefined,
): number | undefined {
  return parseMaxAgeForCookie(setCookieHeaders, "refresh_token");
}

function readStoredExpiresAt(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const ts = Number.parseInt(raw, 10);
  if (!Number.isFinite(ts) || ts < MIN_VALID_EXPIRES_AT_UNIX) {
    return undefined;
  }
  return remainingSecondsUntilExpiresAt(ts) !== undefined ? ts : undefined;
}

export interface AuthSessionTokens {
  access_token: string;
  refresh_token: string;
  session_id?: string;
}

export interface SetAuthSessionCookiesInput {
  tokens: AuthSessionTokens;
  /** Max-Age (seconds) parsed from BE Set-Cookie — sole source of fresh TTL. */
  refreshMaxAge?: number;
}

/**
 * Ghi access_token, refresh_token, session_id vào cookie.
 * TTL lấy từ BE Set-Cookie; fallback auth_session_expires_at khi relay SSR.
 */
export async function setAuthSessionCookies({
  tokens,
  refreshMaxAge,
}: SetAuthSessionCookiesInput): Promise<void> {
  const { access_token, refresh_token, session_id } = tokens;
  const cookieStore = await cookies();

  const storedExpiresAt = readStoredExpiresAt(
    cookieStore.get(AUTH_SESSION_EXPIRES_AT_COOKIE)?.value,
  );
  const resolvedMaxAge = resolveRefreshMaxAgeFromBe({
    refreshMaxAge,
    storedExpiresAt,
  });

  const isProduction = process.env.NODE_ENV === "production";
  const domain = getCookieDomain(process.env.AUTH_COOKIE_DOMAIN);
  const sameSite = "lax" as const;

  const set = (name: string, value: string, maxAge?: number) => {
    cookieStore.set(
      name,
      value,
      buildAuthCookieOptions({
        sameSite,
        isProduction,
        domain,
        ...(maxAge !== undefined ? { maxAge } : {}),
      }),
    );
  };

  const remove = (name: string) => {
    const opts = buildAuthCookieOptions({
      sameSite,
      isProduction,
      domain,
    });
    cookieStore.delete({
      name,
      path: opts.path,
      ...(opts.domain ? { domain: opts.domain } : {}),
    });
  };

  set("access_token", access_token);
  set("refresh_token", refresh_token, resolvedMaxAge);
  if (session_id) {
    set("session_id", session_id, resolvedMaxAge);
  }

  // Fresh Set-Cookie → new absolute expiry. Fallback only → keep stored expiry (no extension).
  const sessionExpiresAt =
    refreshMaxAge !== undefined && refreshMaxAge > 0
      ? expiresAtFromMaxAge(refreshMaxAge)
      : storedExpiresAt;

  if (sessionExpiresAt !== undefined) {
    const metaMaxAge = remainingSecondsUntilExpiresAt(sessionExpiresAt);
    if (metaMaxAge !== undefined) {
      set(AUTH_SESSION_EXPIRES_AT_COOKIE, String(sessionExpiresAt), metaMaxAge);
    }
  }

  remove(LEGACY_AUTH_SESSION_MAX_AGE_COOKIE);
}

/**
 * Xóa toàn bộ auth cookies phía BFF.
 */
export async function clearAuthSessionCookies(): Promise<void> {
  const isProduction = process.env.NODE_ENV === "production";
  const domain = getCookieDomain(process.env.AUTH_COOKIE_DOMAIN);
  const sameSite = "lax" as const;
  const cookieStore = await cookies();

  const remove = (name: string) => {
    const opts = buildAuthCookieOptions({
      sameSite,
      isProduction,
      domain,
    });
    cookieStore.delete({
      name,
      path: opts.path,
      ...(opts.domain ? { domain: opts.domain } : {}),
    });
  };

  remove("access_token");
  remove("refresh_token");
  remove("session_id");
  remove(AUTH_SESSION_EXPIRES_AT_COOKIE);
  remove(LEGACY_AUTH_SESSION_MAX_AGE_COOKIE);
}
