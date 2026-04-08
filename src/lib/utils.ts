import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ---------------------------------------------------------------------------
// buildQueryParams
// ---------------------------------------------------------------------------

/**
 * Builds a complete URL from its constituent parts.
 *
 * @param url      - Base path, e.g. `/users/:id/posts`. Returns `null` when
 *                   falsy so callers can guard cheaply.
 * @param query    - Key/value pairs appended as a query string.
 *                   Encoded via URLSearchParams (RFC 3986 safe).
 * @param params   - Named path segments that replace `:name` placeholders.
 *                   Each value is URI-encoded to prevent path injection.
 * @param fragment - Optional URL fragment appended after `#` (URI-encoded).
 *
 * @returns The assembled URL string, or `null` if `url` was empty/nullish.
 *
 * @example
 * buildQueryParams("/users/:id/posts", { page: "2" }, { id: "42" })
 * // → "/users/42/posts?page=2"
 *
 * buildQueryParams("/search", { q: "hello world" })
 * // → "/search?q=hello+world"
 */
export function buildQueryParams(
  url: string | null | undefined,
  query?: Record<string, string>,
  params?: Record<string, string>,
  fragment?: string,
): string | null {
  if (!url) return null;

  let result = url;

  // Replace :paramName placeholders with encoded path values
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      // Matches :key at end-of-string or before /, ?, or #
      result = result.replace(
        new RegExp(`:${key}(?=[/?#]|$)`, "g"),
        encodeURIComponent(value),
      );
    }
  }

  // Append query string — URLSearchParams encodes both keys and values
  if (query && Object.keys(query).length > 0) {
    const qs = new URLSearchParams(query).toString();
    const separator = result.includes("?") ? "&" : "?";
    result = `${result}${separator}${qs}`;
  }

  // Append optional fragment
  if (fragment) {
    result = `${result}#${encodeURIComponent(fragment)}`;
  }

  return result;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type CookieSameSite = "strict" | "lax" | "none";

export interface BuildHttpOnlyCookieOptionsInput {
  sameSite: CookieSameSite;
  isProduction: boolean;
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

type PickCharacterResult = {
  label: string;
  color: string;
  backgroundColor: string;
};

export function pickCharacter(username: string): PickCharacterResult {
  const trimmedName = username.trim();
  if (!trimmedName) {
    return { label: "U", color: "#6B7280", backgroundColor: "#F3F4F6" };
  }

  const words = trimmedName
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  const label =
    words.length > 1
      ? `${words[0][0]}${words[1][0]}`.toUpperCase()
      : trimmedName.slice(0, 2).toUpperCase();

  let hash = 0;
  for (let i = 0; i < trimmedName.length; i += 1) {
    hash = trimmedName.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }

  const hue = Math.abs(hash) % 360;
  const saturation = 72;
  const lightness = 42;
  const bgSaturation = 60;
  const bgLightness = 94;

  return {
    label,
    color: `hsl(${hue} ${saturation}% ${lightness}%)`,
    backgroundColor: `hsl(${hue} ${bgSaturation}% ${bgLightness}%)`,
  };
}
