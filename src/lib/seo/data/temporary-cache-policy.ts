/**
 * TEMPORARY dormant env cache helper — KEEP (do not delete).
 *
 * Not wired to pages / `seoFetch` / `publicCacheProfiles` while
 * `SEO_TEMPORARY_ENV_CACHE_POLICY.enabled` is false.
 * Flip + wire only after an explicit decision; replace when a permanent
 * ISR / cache policy lands.
 */

import "server-only";

import { SEO_TEMPORARY_ENV_CACHE_POLICY } from "@/constants/seo/rendering";
import type { SeoTemporaryRevalidateSeconds } from "@/types/seo/data";

/**
 * Resolves a temporary Next.js-style revalidate hint from env.
 *
 * - dormant (`enabled: false`) → `null` (no effect)
 * - enabled + non-production → `false` (refresh immediately / no ISR hold)
 * - enabled + production → `productionRevalidateSeconds` (currently 60)
 */
export function resolveSeoTemporaryRevalidateSeconds(): SeoTemporaryRevalidateSeconds {
  if (!SEO_TEMPORARY_ENV_CACHE_POLICY.enabled) {
    return null;
  }

  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  return SEO_TEMPORARY_ENV_CACHE_POLICY.productionRevalidateSeconds;
}
