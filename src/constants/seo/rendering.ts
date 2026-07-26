export const SEO_RENDERING_MODE = {
  SSG: "ssg",
  SSR: "ssr",
  ISR: "isr",
} as const;

/** Suggested revalidate seconds when a reviewed ISR profile exists. */
export const SEO_ISR_HINTS = {
  /** Marketing shells — only after a public cache profile is approved. */
  marketing: 300,
  /** Published catalogue cards — only after a public cache profile is approved. */
  catalogue: 60,
} as const;

/**
 * TEMPORARY dormant env cache flag — KEEP (do not delete).
 *
 * Intent (when deliberately enabled later):
 * - development / non-production → no ISR hold (`revalidate: false`, refresh immediately)
 * - production → temporary `productionRevalidateSeconds` (60)
 *
 * `enabled: false` now → no effect on pages, `seoFetch`, or `publicCacheProfiles`.
 * Replace only after a permanent cache / ISR policy is approved.
 */
export const SEO_TEMPORARY_ENV_CACHE_POLICY = {
  enabled: false,
  productionRevalidateSeconds: 60,
} as const;
