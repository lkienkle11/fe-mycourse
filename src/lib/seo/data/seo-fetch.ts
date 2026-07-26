/**
 * Thin typed wrap around serverRawFetch + fail-closed cache-policy.
 * Do not register production publicCacheProfiles here.
 */

import "server-only";

import { serverRawFetch } from "@/api/server/server-raw-http";
import type { ApiResult } from "@/types/api";
import type { SeoFetchOptions } from "@/types/seo/data";

/**
 * Public SEO GET helper. Always delegates to `serverRawFetch`.
 * No cookies/Authorization; no parallel HTTP stack.
 */
export async function seoFetch<T>(
  url: string,
  options: SeoFetchOptions,
): Promise<ApiResult<T>> {
  return serverRawFetch<T>(url, options);
}
