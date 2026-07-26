/**
 * Robots metadata presets for Next.js Metadata.robots.
 */

import type { Metadata } from "next";
import type { PUBLIC_ROUTES } from "@/constants/route";
import { SEO_ROBOTS_PRESETS } from "@/constants/seo/robots";
import { isSeoIndexablePublicRouteKey } from "@/lib/seo/indexable-routes";
import type { SeoRobotsMode } from "@/types/seo/metadata";

export function robotsPreset(
  mode: SeoRobotsMode = "indexable",
): NonNullable<Metadata["robots"]> {
  return SEO_ROBOTS_PRESETS[mode];
}

/**
 * Map a PUBLIC_ROUTES key to robots mode.
 * Only SEO-indexable keys are indexable; auth and other public flows are noindex.
 */
export function robotsModeForPublicRouteKey(
  key: keyof typeof PUBLIC_ROUTES,
): SeoRobotsMode {
  return isSeoIndexablePublicRouteKey(key) ? "indexable" : "noindex";
}
