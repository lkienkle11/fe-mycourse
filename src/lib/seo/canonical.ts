/**
 * Absolute canonical URL helpers. Reuses i18n getPathname + site origin.
 */

import { getPathname } from "@/i18n/navigation";
import { homeHref } from "@/lib/navigation/home";
import { resolveSiteConfig } from "@/lib/seo/site-config";
import { buildQueryParams } from "@/lib/utils/url";
import type { CanonicalInput } from "@/types/seo/metadata";

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

export function toAbsoluteUrl(siteUrl: string, pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${siteUrl.replace(/\/$/, "")}${path}`;
}
