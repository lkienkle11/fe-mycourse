import { hasLocale } from "next-intl";
import {
  REFRESH_TOKEN_COOKIE,
  SESSION_ID_COOKIE,
} from "@/constants/auth-cookie";
import { routing } from "@/i18n/routing";
import { signedInHomeHref } from "@/lib/navigation/routes";

type CookieReader = { has(name: string): boolean };

/** A session exists when both the refresh token and the session id cookies are present. */
export function hasAuthSessionCookies(cookies: CookieReader): boolean {
  return cookies.has(REFRESH_TOKEN_COOKIE) && cookies.has(SESSION_ID_COOKIE);
}

/**
 * The locale of a locale-root pathname (`/vi`, `/en`, optional trailing
 * slash), or null for anything else (including `/`, `/fr`, `/vi/home`).
 */
export function getLocaleRootLocale(pathname: string): string | null {
  const trimmed = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (!trimmed.startsWith("/")) return null;
  const segment = trimmed.slice(1);
  if (!segment || segment.includes("/")) return null;
  return hasLocale(routing.locales, segment) ? segment : null;
}

/**
 * The locale of the signed-in home pathname (`/vi/home`, `/en/home/`), or
 * null for anything else.
 */
function getSignedInHomeLocale(pathname: string): string | null {
  const trimmed = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (!trimmed.endsWith(signedInHomeHref)) return null;
  return getLocaleRootLocale(trimmed.slice(0, -signedInHomeHref.length));
}

/**
 * `/{locale}/home` when a signed-in visitor requests a locale root, else null.
 */
export function resolveSignedInHomeRedirectPath(input: {
  pathname: string;
  hasSession: boolean;
}): string | null {
  if (!input.hasSession) return null;
  const locale = getLocaleRootLocale(input.pathname);
  return locale ? `/${locale}${signedInHomeHref}` : null;
}

/**
 * `/{locale}` (the public homepage) when a visitor without a session requests
 * the signed-in home, else null. Stale cookies still count as a session here;
 * the page itself handles an expired one.
 */
export function resolveGuestHomeRedirectPath(input: {
  pathname: string;
  hasSession: boolean;
}): string | null {
  if (input.hasSession) return null;
  const locale = getSignedInHomeLocale(input.pathname);
  return locale ? `/${locale}` : null;
}
