/**
 * Pure sitemap entry builder. Not wired to app/sitemap.ts this phase.
 * Defaults to SEO-indexable pathnames — not raw PUBLIC_ROUTES.
 */

import { PRIVATE_ROUTES, PUBLIC_ROUTES } from "@/constants/route";
import { flattenRouteTreePaths } from "@/lib/navigation/flatten-route-tree";
import { toPublicRoute } from "@/lib/navigation/routes";
import { buildCanonicalUrl, localizedPathname } from "@/lib/seo/canonical";
import { listSeoIndexablePathnames } from "@/lib/seo/indexable-routes";
import { siteDefaultLocale, siteLocales } from "@/lib/seo/site-config";
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

export function listPrivatePathPrefixes(): string[] {
  return flattenRouteTreePaths(PRIVATE_ROUTES);
}

/**
 * Builds absolute sitemap entries with hreflang alternates per locale.
 * Default pathnames = SEO_INDEXABLE_PUBLIC_ROUTE_KEYS — never raw PUBLIC_ROUTES.
 */
export function buildSitemapEntries(
  input: BuildSitemapEntriesInput = {},
): SitemapEntry[] {
  const locales = input.locales ?? siteLocales();
  const pathnames = input.pathnames ?? listSeoIndexablePathnames();
  const defaultLocale = siteDefaultLocale();
  const entries: SitemapEntry[] = [];

  for (const pathname of pathnames) {
    const languages: Record<string, string> = {};
    for (const locale of locales) {
      languages[locale] = buildCanonicalUrl({
        locale,
        pathname,
        site: input.site,
      });
    }
    languages["x-default"] = buildCanonicalUrl({
      locale: defaultLocale,
      pathname,
      site: input.site,
    });

    entries.push({
      url: buildCanonicalUrl({
        locale: defaultLocale,
        pathname,
        site: input.site,
      }),
      changeFrequency: input.changeFrequency ?? "weekly",
      priority: input.priority ?? (pathname === "/" ? 1 : 0.7),
      alternates: { languages },
    });
  }

  return entries;
}

/** Debug helper: localized public paths without absolute origin. */
export function listLocalizedPublicPaths(
  locale: string,
  pathnames: readonly PublicRouteValue[] = Object.values(PUBLIC_ROUTES),
): string[] {
  return pathnames.map((pathname) => localizedPathname(locale, pathname));
}
