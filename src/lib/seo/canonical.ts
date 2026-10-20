/**
 * Absolute canonical URL helpers. Reuses i18n getPathname + site origin.
 */

import { getPathname } from "@/i18n/navigation";
import { homeHref } from "@/lib/navigation/home";
import {
  resolveSiteConfig,
  siteDefaultLocale,
  siteLocales,
} from "@/lib/seo/site-config";
import { buildQueryParams } from "@/lib/utils/url";
import type {
  CanonicalInput,
  LanguageAlternatesInput,
} from "@/types/seo/metadata";

function ensureLeadingSlash(pathname: string): string {
  if (!pathname) return homeHref;
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

/**
 * Localized pathname via next-intl (includes locale prefix when configured).
 */
export function localizedPathname(
  locale: string,
  pathname: string = homeHref,
): string {
  const href = ensureLeadingSlash(pathname);
  return getPathname({ locale, href });
}

export function buildCanonicalUrl(input: CanonicalInput): string {
  const site = resolveSiteConfig(input.site ?? { readEnv: true });
  const path = localizedPathname(input.locale, input.pathname ?? homeHref);
  const withQuery = buildQueryParams(path, input.query) ?? path;
  return `${site.siteUrl}${withQuery.startsWith("/") ? withQuery : `/${withQuery}`}`;
}

/**
 * hreflang map: one canonical URL per locale plus `x-default`
 * (the default locale's canonical). Shared by page metadata and the sitemap.
 */
export function buildLanguageAlternates(
  input: LanguageAlternatesInput,
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of input.locales ?? siteLocales()) {
    languages[locale] = buildCanonicalUrl({
      locale,
      pathname: input.pathname,
      site: input.site,
    });
  }
  languages["x-default"] = buildCanonicalUrl({
    locale: siteDefaultLocale(),
    pathname: input.pathname,
    site: input.site,
  });
  return languages;
}

export function toAbsoluteUrl(siteUrl: string, pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${siteUrl.replace(/\/$/, "")}${path}`;
}
