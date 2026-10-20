/**
 * Pure sitemap entry builder, consumed by `src/app/sitemap.ts`.
 * Defaults to SEO-indexable pathnames — not raw PUBLIC_ROUTES.
 */

import { PUBLIC_ROUTES } from "@/constants/route";
import { toPublicRoute } from "@/lib/navigation/routes";
import {
  buildCanonicalUrl,
  buildLanguageAlternates,
  localizedPathname,
} from "@/lib/seo/canonical";
import { listSeoIndexablePathnames } from "@/lib/seo/indexable-routes";
import { siteDefaultLocale } from "@/lib/seo/site-config";
import type {
  BuildSitemapEntriesInput,
  PublicRouteValue,
  SitemapEntry,
} from "@/types/seo/metadata";

export {
  isSeoIndexablePublicRouteKey,
  listSeoIndexablePathnames,
  SEO_INDEXABLE_PUBLIC_ROUTE_KEYS,
} from "@/lib/seo/indexable-routes";

/**
 * All publicly routable static pathnames (including auth flows).
 * Prefer `listSeoIndexablePathnames` for sitemap / crawl-allow.
 */
export function listPublicStaticPathnames(): string[] {
  return Object.values(PUBLIC_ROUTES).map((route) => toPublicRoute(route));
}

/**
 * Builds absolute sitemap entries with hreflang alternates per locale.
 * Default pathnames = SEO_INDEXABLE_PUBLIC_ROUTE_KEYS — never raw PUBLIC_ROUTES.
 */
export function buildSitemapEntries(
  input: BuildSitemapEntriesInput = {},
): SitemapEntry[] {
  const pathnames = input.pathnames ?? listSeoIndexablePathnames();
  const defaultLocale = siteDefaultLocale();

  return pathnames.map((pathname) => ({
    url: buildCanonicalUrl({
      locale: defaultLocale,
      pathname,
      site: input.site,
    }),
    changeFrequency: input.changeFrequency ?? "weekly",
    priority: input.priority ?? (pathname === "/" ? 1 : 0.7),
    alternates: {
      languages: buildLanguageAlternates({
        pathname,
        locales: input.locales,
        site: input.site,
      }),
    },
  }));
}

/** Debug helper: localized public paths without absolute origin. */
export function listLocalizedPublicPaths(
  locale: string,
  pathnames: readonly PublicRouteValue[] = Object.values(PUBLIC_ROUTES),
): string[] {
  return pathnames.map((pathname) => localizedPathname(locale, pathname));
}
