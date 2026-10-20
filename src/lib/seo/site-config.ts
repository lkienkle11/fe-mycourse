/**
 * Site origin contract for metadataBase / canonical / OG.
 * Server-side SITE_URL only — pure origin; no NEXT_PUBLIC_* fallbacks.
 * Production: https, never a loopback host. Outside production: also
 * http://localhost and http://127.0.0.1 for local development.
 */

import {
  DEFAULT_SITE_NAME,
  DEFAULT_THEME_COLOR,
} from "@/constants/seo/metadata";
import { routing } from "@/i18n/routing";
import type {
  ParseSiteOriginOptions,
  ResolveSiteConfigInput,
  SeoSiteConfig,
} from "@/types/seo/metadata";

const LOOPBACK_HOSTNAMES: readonly string[] = [
  "localhost",
  "127.0.0.1",
  "[::1]",
];
const DEV_HTTP_HOSTNAMES: readonly string[] = ["localhost", "127.0.0.1"];

/** Lower-cased hostname without a trailing dot (`localhost.` is still loopback). */
function normalizedHostname(url: URL): string {
  return url.hostname.trim().toLowerCase().replace(/\.$/, "");
}

/**
 * Parse and validate a pure origin: https, or (only with
 * `loopback: "allow-http"`) http on localhost / 127.0.0.1.
 * Rejects username/password, pathname other than empty/"/", search, and hash.
 */
export function parseAbsoluteHttpsOrigin(
  raw: string,
  options: ParseSiteOriginOptions = {},
): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const hostname = normalizedHostname(url);
    if (!hostname) return null;
    if (url.protocol === "http:") {
      if (
        options.loopback !== "allow-http" ||
        !DEV_HTTP_HOSTNAMES.includes(hostname)
      ) {
        return null;
      }
    } else if (url.protocol !== "https:") {
      return null;
    } else if (
      options.loopback === "reject" &&
      LOOPBACK_HOSTNAMES.includes(hostname)
    ) {
      return null;
    }
    if (url.username || url.password) return null;
    if (url.search || url.hash) return null;
    const path = url.pathname;
    if (path !== "" && path !== "/") return null;
    return url;
  } catch {
    return null;
  }
}

/** Alias of parseAbsoluteHttpsOrigin (origin-only contract). */
export const parseAbsoluteHttpsUrl = parseAbsoluteHttpsOrigin;

export function normalizeSiteOrigin(url: URL): string {
  return url.origin.replace(/\/$/, "");
}

export class SiteConfigError extends Error {
  readonly code = "invalid-site-url" as const;

  constructor(message: string) {
    super(message);
    this.name = "SiteConfigError";
  }
}

/**
 * Resolve site config. Throws SiteConfigError when origin is missing/invalid.
 */
export function resolveSiteConfig(
  input: ResolveSiteConfigInput = {},
): SeoSiteConfig {
  const fromEnv = input.readEnv === true ? process.env.SITE_URL : undefined;
  const raw = (input.siteUrl ?? fromEnv ?? "").trim();
  const isProduction = (input.nodeEnv ?? process.env.NODE_ENV) === "production";
  const parsed = parseAbsoluteHttpsOrigin(raw, {
    loopback: isProduction ? "reject" : "allow-http",
  });
  if (!parsed) {
    throw new SiteConfigError(
      isProduction
        ? "SITE_URL must be a pure public https:// origin in production (no path/query/hash/userinfo; no localhost/127.0.0.1/[::1]; not NEXT_PUBLIC_*)"
        : "SITE_URL must be a pure https:// origin (or http://localhost / http://127.0.0.1 outside production); no path/query/hash/userinfo; not NEXT_PUBLIC_*",
    );
  }

  return {
    siteUrl: normalizeSiteOrigin(parsed),
    siteName: input.siteName?.trim() || DEFAULT_SITE_NAME,
    defaultOgImage: input.defaultOgImage,
    themeColor: input.themeColor?.trim() || DEFAULT_THEME_COLOR,
    twitterSite: input.twitterSite,
  };
}

/** Locales owned by next-intl routing — do not invent a parallel list. */
export function siteLocales(): readonly string[] {
  return routing.locales;
}

export function siteDefaultLocale(): string {
  return routing.defaultLocale;
}
