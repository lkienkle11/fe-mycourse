import Cookies from "js-cookie";
import { isServer } from "./runtime";

export type CookieSameSite = "strict" | "lax" | "none";

export interface BuildHttpOnlyCookieOptionsInput {
  sameSite: CookieSameSite;
  isProduction: boolean;
  maxAge?: number;
  domain?: string;
}

export interface BuildCookieOptionsInput {
  sameSite: CookieSameSite;
  isProduction: boolean;
  httpOnly?: boolean;
  maxAge?: number;
  domain?: string;
}

/**
 * Domain cha cho cookie (vd. `yourdomain.net`) khi FE và API là hai subdomain.
 * Localhost: trả về undefined để không set `domain` trên cookie.
 */
export function getCookieDomain(rawDomain?: string): string | undefined {
  const normalized = rawDomain?.trim();
  if (!normalized || normalized === "localhost") return undefined;
  return normalized.startsWith(".") ? normalized.slice(1) : normalized;
}

/**
 * Build HttpOnly cookie options dùng chung cho Server Actions.
 */
export function buildHttpOnlyCookieOptions(
  input: BuildHttpOnlyCookieOptionsInput,
) {
  const { sameSite, isProduction, maxAge, domain } = input;
  return {
    httpOnly: true as const,
    sameSite,
    secure: isProduction,
    path: "/" as const,
    ...(domain ? { domain } : {}),
    ...(maxAge !== undefined ? { maxAge } : {}),
  };
}

/**
 * Build HttpOnly cookie options for auth session cookies (access/refresh/session).
 */
export function buildAuthCookieOptions(input: BuildHttpOnlyCookieOptionsInput) {
  return buildHttpOnlyCookieOptions(input);
}

/**
 * Build cookie options cho Server Actions (non-auth UI cookies).
 * Auth cookies phải dùng {@link buildAuthCookieOptions} — luôn HttpOnly.
 */
export function buildCookieOptions(input: BuildCookieOptionsInput) {
  const { sameSite, isProduction, httpOnly = false, maxAge, domain } = input;
  return {
    httpOnly,
    sameSite,
    secure: isProduction,
    path: "/" as const,
    ...(domain ? { domain } : {}),
    ...(maxAge !== undefined ? { maxAge } : {}),
  };
}

// ---------------------------------------------------------------------------
// Isomorphic cookie helpers
// ---------------------------------------------------------------------------

/**
 * Reads a cookie value.
 * - Client: via js-cookie.
 * - Server: via next/headers (requires an active Next.js request context).
 */
export async function getCookieValue(name: string): Promise<string | null> {
  if (!isServer()) {
    return Cookies.get(name) ?? null;
  }
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    return store.get(name)?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Writes a cookie value.
 * - Client: via js-cookie.
 * - Server: via next/headers.
 *   Only works inside a Server Action or Route Handler (not a pure RSC).
 *   Failures are swallowed silently.
 */
const AUTH_COOKIE_NAMES = [
  "access_token",
  "refresh_token",
  "session_id",
] as const;

/**
 * Xóa auth cookies phía client — no-op khi cookies là HttpOnly (logout qua Server Action).
 * @deprecated HttpOnly auth cookies không thể xóa bằng JS; dùng clearAuthSessionCookies.
 */
export function clearAuthCookiesClient(): void {
  // HttpOnly cookies are cleared server-side via logoutAction / clearAuthSessionCookies.
}

export async function setCookieValue(
  name: string,
  value: string,
  options?: { maxAge?: number },
): Promise<void> {
  if ((AUTH_COOKIE_NAMES as readonly string[]).includes(name) && !isServer()) {
    return;
  }
  if (!isServer()) {
    Cookies.set(name, value, {
      path: "/",
      sameSite: "lax",
      ...(options?.maxAge ? { expires: options.maxAge / 86400 } : {}),
    });
    return;
  }
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    store.set(name, value, {
      path: "/",
      sameSite: "lax",
      ...(options?.maxAge ? { maxAge: options.maxAge } : {}),
    });
  } catch {
    // In pure RSC contexts cookies are read-only — silently skip.
  }
}
