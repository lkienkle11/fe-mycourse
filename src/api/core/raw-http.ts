/**
 * Bare Fetch helpers — no MyCourse auth, no refresh, no global error store.
 * Public RawApiOptions: optional GET-only `cache`; no redirect/trustedOrigin.
 */

import { isServer } from "@/lib/utils/runtime";
import type { ApiResult } from "@/types/api";
import { executeFetchCore } from "./fetch-core";

export type RawApiOptions = {
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  params?: Record<string, string>;
  timeout?: number;
  withCredentials?: boolean;
  baseURL?: string;
  signal?: AbortSignal;
  /**
   * Honored only for raw GET. When omitted, defaults match committed behavior:
   * browser GET → omit (HTTP cache semantics); server GET → no-store.
   * Mutations/OPTIONS always use no-store (this field is ignored).
   * Fetch `cache` is not a TTL — exact expiry needs Cache-Control / storage / Next revalidate.
   */
  cache?: RequestCache;
};

export type RawFetchApiOptions = RawApiOptions;
export type RawMutationApiOptions = RawApiOptions;

function mapCredentials(
  withCredentials: boolean | undefined,
): RequestCredentials | undefined {
  if (withCredentials === true) return "include";
  if (withCredentials === false) return "same-origin";
  return undefined;
}

function resolveRawCache(
  method: string,
  callerCache: RequestCache | undefined,
): RequestCache | undefined {
  if (method === "GET") {
    if (callerCache !== undefined) return callerCache;
    if (!isServer()) {
      // Browser GET preserves HTTP cache semantics (omit cache option).
      return undefined;
    }
    return "no-store";
  }
  // Mutations and OPTIONS: always no-store (ignore caller cache).
  return "no-store";
}

async function rawRequest<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS",
  url: string,
  data: unknown | undefined,
  options: RawApiOptions,
): Promise<ApiResult<T>> {
  const {
    headers,
    cookies,
    params,
    timeout,
    withCredentials,
    baseURL,
    signal,
    cache,
  } = options;

  return executeFetchCore<T>({
    method,
    url,
    baseURL,
    params,
    headers,
    cookies,
    data,
    timeoutMs: timeout,
    signal,
    credentials: mapCredentials(withCredentials),
    cache: resolveRawCache(method, cache),
    mode: "raw",
    allowBody: method === "POST" || method === "PUT" || method === "PATCH",
  });
}

export async function rawFetch<T>(
  url: string,
  options: RawFetchApiOptions = {},
): Promise<ApiResult<T>> {
  return rawRequest<T>("GET", url, undefined, options);
}

export async function rawPost<T, D = unknown>(
  url: string,
  data?: D,
  options: RawMutationApiOptions = {},
): Promise<ApiResult<T>> {
  return rawRequest<T>("POST", url, data, options);
}

export async function rawPut<T, D = unknown>(
  url: string,
  data?: D,
  options: RawMutationApiOptions = {},
): Promise<ApiResult<T>> {
  return rawRequest<T>("PUT", url, data, options);
}

export async function rawPatch<T, D = unknown>(
  url: string,
  data?: D,
  options: RawMutationApiOptions = {},
): Promise<ApiResult<T>> {
  return rawRequest<T>("PATCH", url, data, options);
}

export async function rawDelete<T>(
  url: string,
  options: RawMutationApiOptions = {},
): Promise<ApiResult<T>> {
  return rawRequest<T>("DELETE", url, undefined, options);
}

export async function rawOptions<T>(
  url: string,
  options: RawFetchApiOptions = {},
): Promise<ApiResult<T>> {
  return rawRequest<T>("OPTIONS", url, undefined, options);
}
