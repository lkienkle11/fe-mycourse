/**
 * Low-level API helpers built on top of the shared Axios instance.
 *
 * Return type: every method resolves to `ApiResult<T>`:
 *   { data: T; statusCode: number }
 *
 * Error handling: errors are NOT swallowed here. The Axios response
 * interceptor in instance.ts already:
 *   1. Logs the error to the console.
 *   2. Pushes it into the global `useApiError` Zustand store.
 *   3. Re-throws so callers can still use try-catch when needed.
 *
 * Cache behaviour (apiFetch only) — TEMPORARILY DISABLED, see TODO below:
 *   - Caching is ON by default with a hard-coded 1-second baseline TTL.
 *   - Pass `caching: false` to bypass the cache entirely for a specific call.
 *   - Pass `caching: { ttlSeconds: N }` to add N extra seconds on top of the
 *     baseline, e.g. ttlSeconds=1 → total TTL = 1s (default) + 1s = 2s.
 *   - Client runtime  → IndexedDB  (persists across page reloads within TTL).
 *   - Server runtime  → module-level Map (in-process memory, per-worker).
 *
 * Extra options (all four methods):
 *   - `headers`  – merged on top of the instance defaults.
 *   - `cookies`  – serialised into the Cookie header (server-side forwarding).
 *   - `params`   – URL query params forwarded to Axios.
 *   - `otherAxiosInstance` – completely replaces the shared instance for this
 *     single request (no fallback merging).
 */

import type { AxiosInstance, AxiosRequestConfig } from "axios";
import type { ApiResult } from "@/types/api";
// TODO: re-enable cache imports when caching is turned back on
// import {
//   DEFAULT_CACHE_MS,
//   getClientCache,
//   getServerCache,
//   setClientCache,
//   setServerCache,
// } from "./cache";
import { apiInstance } from "./instance";

// ---------------------------------------------------------------------------
// Shared option types
// ---------------------------------------------------------------------------

export interface CachingOptions {
  /**
   * Extra seconds added on top of the 1-second default TTL.
   * Total TTL = 1s + ttlSeconds.
   */
  ttlSeconds?: number;
}

export interface BaseApiOptions {
  /** Headers merged with (and overriding) the instance defaults. */
  headers?: Record<string, string>;
  /**
   * Additional cookies to include in the Cookie header.
   * Values are URI-encoded to prevent header injection.
   */
  cookies?: Record<string, string>;
  /**
   * Swap the underlying Axios instance entirely for this request.
   * All instance-level defaults (baseURL, interceptors, …) come from this
   * instance instead of the shared singleton.
   */
  otherAxiosInstance?: AxiosInstance;
}

export interface FetchApiOptions extends BaseApiOptions {
  /**
   * Caching strategy:
   *   - `undefined` (default) → 1-second baseline cache.
   *   - `{ ttlSeconds: N }`   → (1 + N)-second cache.
   *   - `false`               → skip cache for this call.
   */
  caching?: CachingOptions | false;
  /** Axios-style query-string params appended to the URL. */
  params?: Record<string, string>;
}

export type MutationApiOptions = BaseApiOptions & {
  /** Axios-style query-string params appended to the URL. */
  params?: Record<string, string>;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function resolveInstance(other?: AxiosInstance): AxiosInstance {
  return other ?? apiInstance;
}

function buildAxiosConfig(
  options: Omit<BaseApiOptions, "otherAxiosInstance"> & {
    params?: Record<string, string>;
  },
): AxiosRequestConfig {
  const { headers = {}, cookies = {}, params } = options;

  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("; ");

  return {
    params,
    headers: {
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...headers,
    },
  };
}

// TODO: re-enable when caching is turned back on
// /**
//  * Deterministic cache key: URL + sorted query-param string.
//  * Sorting ensures the same params in different orders share one cache slot.
//  */
// function buildCacheKey(url: string, params?: Record<string, string>): string {
//   if (!params || Object.keys(params).length === 0) return url;
//   const qs = Object.entries(params)
//     .sort(([a], [b]) => a.localeCompare(b))
//     .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
//     .join("&");
//   return `${url}?${qs}`;
// }

// TODO: re-enable when caching is turned back on
// /**
//  * Returns the total cache TTL in milliseconds, or `null` when caching is
//  * explicitly disabled.
//  */
// function resolveTTLMs(
//   caching: CachingOptions | false | undefined,
// ): number | null {
//   if (caching === false) return null;
//   return DEFAULT_CACHE_MS + (caching?.ttlSeconds ?? 0) * 1_000;
// }

// ---------------------------------------------------------------------------
// Public API methods
// ---------------------------------------------------------------------------

/**
 * GET request. Returns `{ data, statusCode }`.
 *
 * On error the Axios interceptor logs + stores the error globally.
 * The promise still rejects so callers can handle it with try-catch if needed.
 *
 * @example
 * const { data, statusCode } = await apiFetch<User[]>("/users");
 */
export async function apiFetch<T>(
  url: string,
  options: FetchApiOptions = {},
): Promise<ApiResult<T>> {
  const { caching: _caching, otherAxiosInstance, ...rest } = options;
  const instance = resolveInstance(otherAxiosInstance);
  const axiosConfig = buildAxiosConfig(rest);

  // TODO: re-enable caching block below when cache is turned back on
  // const ttlMs = resolveTTLMs(_caching);
  // const cacheKey = buildCacheKey(url, rest.params);
  // const isClient = typeof window !== "undefined";
  //
  // if (ttlMs !== null) {
  //   const cached = isClient
  //     ? await getClientCache<T>(cacheKey)
  //     : getServerCache<T>(cacheKey);
  //   if (cached !== null) return { data: cached, statusCode: 200 };
  // }

  const { data, status: statusCode } = await instance.get<T>(url, axiosConfig);

  // TODO: re-enable cache write block below when cache is turned back on
  // if (ttlMs !== null) {
  //   if (isClient) {
  //     await setClientCache(cacheKey, data, ttlMs);
  //   } else {
  //     setServerCache(cacheKey, data, ttlMs);
  //   }
  // }

  return { data, statusCode };
}

/**
 * POST request. Returns `{ data, statusCode }`.
 *
 * @example
 * const { data, statusCode } = await apiPost<User, CreateUserDto>("/users", payload);
 */
export async function apiPost<T, D = unknown>(
  url: string,
  data?: D,
  options: MutationApiOptions = {},
): Promise<ApiResult<T>> {
  const { otherAxiosInstance, ...rest } = options;
  const { data: responseData, status: statusCode } = await resolveInstance(
    otherAxiosInstance,
  ).post<T>(url, data, buildAxiosConfig(rest));
  return { data: responseData, statusCode };
}

/**
 * PUT request. Returns `{ data, statusCode }`.
 *
 * @example
 * const { data, statusCode } = await apiPut<User, UpdateUserDto>("/users/1", payload);
 */
export async function apiPut<T, D = unknown>(
  url: string,
  data?: D,
  options: MutationApiOptions = {},
): Promise<ApiResult<T>> {
  const { otherAxiosInstance, ...rest } = options;
  const { data: responseData, status: statusCode } = await resolveInstance(
    otherAxiosInstance,
  ).put<T>(url, data, buildAxiosConfig(rest));
  return { data: responseData, statusCode };
}

/**
 * DELETE request. Returns `{ data, statusCode }`.
 *
 * @example
 * const { data, statusCode } = await apiDelete<void>("/users/1");
 */
export async function apiDelete<T>(
  url: string,
  options: MutationApiOptions = {},
): Promise<ApiResult<T>> {
  const { otherAxiosInstance, ...rest } = options;
  const { data, status: statusCode } = await resolveInstance(
    otherAxiosInstance,
  ).delete<T>(url, buildAxiosConfig(rest));
  return { data, statusCode };
}
