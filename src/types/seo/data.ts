import type { PublicCacheProfileId } from "@/api/server/cache-policy";
import type { RawServerFetchApiOptions } from "@/api/server/server-raw-http";
import type { SEO_RENDERING_MODE } from "@/constants/seo/rendering";

export type SeoRenderingMode =
  (typeof SEO_RENDERING_MODE)[keyof typeof SEO_RENDERING_MODE];

export type SeoFetchOptions = RawServerFetchApiOptions & {
  /**
   * Required reviewed profile id. With an empty registry every call fail-closes.
   */
  cacheProfileId: PublicCacheProfileId;
};
