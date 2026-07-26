/**
 * Site origin contract for metadataBase / canonical / OG.
 * Server-side SITE_URL only — pure https origin; no NEXT_PUBLIC_* fallbacks.
 */

import {
  DEFAULT_SITE_NAME,
  DEFAULT_THEME_COLOR,
} from "@/constants/seo/metadata";
import { routing } from "@/i18n/routing";
import type {
  ResolveSiteConfigInput,
  SeoSiteConfig,
} from "@/types/seo/metadata";

/**
 * Parse and validate a pure https origin.
 * Rejects username/password, pathname other than empty/"/", search, and hash.
 */
export function parseAbsoluteHttpsOrigin(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return null;
    if (!url.hostname.trim()) return null;
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
  const parsed = parseAbsoluteHttpsOrigin(raw);
  if (!parsed) {
    throw new SiteConfigError(
      "SITE_URL must be a pure https:// origin (no path/query/hash/userinfo; not NEXT_PUBLIC_*)",
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
