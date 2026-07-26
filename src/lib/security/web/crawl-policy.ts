/**
 * Crawl / robots disallow lists derived from route constants.
 * Does not replace authentication or authorization.
 */

import { PRIVATE_RESOURCE_ROUTES, PRIVATE_ROUTES } from "@/constants/route";
import { flattenRouteTreePaths } from "@/lib/navigation/flatten-route-tree";
import { listSeoIndexablePathnames } from "@/lib/seo/indexable-routes";

export { SIGNED_IN_HOME_PATH } from "@/constants/seo/routes";

/** Unique sorted private app path prefixes for robots Disallow. */
export function privateCrawlDisallowPaths(): string[] {
  const paths = [
    ...flattenRouteTreePaths(PRIVATE_ROUTES),
    ...flattenRouteTreePaths(PRIVATE_RESOURCE_ROUTES),
  ].map((path) => {
    // Strip :param segments → directory prefix for Disallow
    const cleaned = path.replace(/\/:[^/]+/g, "");
    return cleaned.endsWith("/") && cleaned.length > 1
      ? cleaned.slice(0, -1)
      : cleaned;
  });
  return [...new Set(paths)].sort();
}

/**
 * Public paths that may be indexed once SITE_URL + content policy allow.
 * Aligns with SEO-indexable allow-list — not every PUBLIC_ROUTES entry.
 */
export function publicCrawlAllowPaths(): string[] {
  return [...new Set(listSeoIndexablePathnames())].sort();
}

/**
 * Signed-in `/home` is personalized-shaped — keep privateApp / noindex
 * until product proves a public, non-personalized slice is safe to index.
 */
export function signedInHomeRobotsMode(): "privateApp" {
  return "privateApp";
}
