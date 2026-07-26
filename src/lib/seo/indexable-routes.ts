/**
 * SEO-indexable subset of PUBLIC_ROUTES keys.
 * Public-routable ≠ indexable — auth flows stay out of sitemap defaults.
 */

import { PUBLIC_ROUTES } from "@/constants/route";
import { SEO_INDEXABLE_PUBLIC_ROUTE_KEYS } from "@/constants/seo/routes";
import { toPublicRoute } from "@/lib/navigation/routes";
import type { SeoIndexablePublicRouteKey } from "@/types/seo/metadata";

export { SEO_INDEXABLE_PUBLIC_ROUTE_KEYS } from "@/constants/seo/routes";

export function isSeoIndexablePublicRouteKey(
  key: keyof typeof PUBLIC_ROUTES,
): key is SeoIndexablePublicRouteKey {
  return (SEO_INDEXABLE_PUBLIC_ROUTE_KEYS as readonly string[]).includes(key);
}

/** Pathnames for default sitemap / public crawl-allow. */
export function listSeoIndexablePathnames(): string[] {
  return SEO_INDEXABLE_PUBLIC_ROUTE_KEYS.map((key) =>
    toPublicRoute(PUBLIC_ROUTES[key]),
  );
}
