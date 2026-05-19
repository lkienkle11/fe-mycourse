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
 * Domain cha cho cookie (vd. `mycoursesdev.xyz`) khi FE và API là hai subdomain.
 * Localhost: trả về undefined để không set `domain` trên cookie.
 */
export function getCookieDomain(rawDomain?: string): string | undefined {
  const normalized = rawDomain?.trim();
  if (!normalized || normalized === "localhost") return undefined;
  return normalized.startsWith(".") ? normalized.slice(1) : normalized;
}

/**
 * Build HttpOnly cookie options dùng chung cho Server Actions.
 * @deprecated Dùng buildCookieOptions với httpOnly: false cho auth cookies mới.
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
 * Build cookie options cho Server Actions.
 * httpOnly mặc định là false để client-side JS có thể đọc token từ cookie
 * và đính vào Authorization header.
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
 * Xóa auth cookies phía client (tab hiện tại) — mirror clearAuthSessionCookies.
 */
export function clearAuthCookiesClient(): void {
  if (isServer()) return;
  const isProduction = process.env.NODE_ENV === "production";
  const domain = getCookieDomain(process.env.AUTH_COOKIE_DOMAIN);
  for (const name of AUTH_COOKIE_NAMES) {
    Cookies.remove(name, {
      path: "/",
      ...(domain ? { domain } : {}),
      ...(isProduction ? { secure: true } : {}),
    });
  }
}

export async function setCookieValue(
  name: string,
  value: string,
  options?: { maxAge?: number },
): Promise<void> {
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
