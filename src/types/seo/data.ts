import type { PublicCacheProfileId } from "@/api/server/cache-policy";
import type { RawServerFetchApiOptions } from "@/api/server/server-raw-http";
import type {
  SEO_RENDERING_MODE,
  SEO_TEMPORARY_ENV_CACHE_POLICY,
} from "@/constants/seo/rendering";

export type SeoRenderingMode =
  (typeof SEO_RENDERING_MODE)[keyof typeof SEO_RENDERING_MODE];

/** Shape of the TEMPORARY dormant env cache flag (keep until permanent policy). */
export type SeoTemporaryEnvCachePolicy = typeof SEO_TEMPORARY_ENV_CACHE_POLICY;

/**
 * Result of `resolveSeoTemporaryRevalidateSeconds`.
 * `null` = dormant (`enabled: false`) — callers must ignore.
 * `false` = no ISR hold (dev / non-production when enabled).
 * `number` = revalidate seconds (production when enabled).
 */
export type SeoTemporaryRevalidateSeconds = number | false | null;

export type SeoFetchOptions = RawServerFetchApiOptions & {
  /**
   * Required reviewed profile id. With an empty registry every call fail-closes.
   */
  cacheProfileId: PublicCacheProfileId;
};
