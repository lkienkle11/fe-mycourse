/**
 * Server-only public cached GET entrypoint + cache profile registry.
 * Requires cacheProfileId; empty registry is a valid PASS (always rejects).
 */

import "server-only";

import type { ApiResult } from "@/types/api";
import { executeFetchCore, resolveDefaultApiBaseURL } from "../core/fetch-core";
import {
  type ApiPolicyErrorCode,
  redactApiErrorUrl,
  throwApiPolicyError,
} from "../core/fetch-error";
import { getHeader } from "../core/fetch-helpers";
import type { RawApiOptions } from "../core/raw-http";
import {
  type PublicCacheProfileId,
  type ResolvedPublicCacheOptions,
  validatePublicCacheRequest,
} from "./cache-policy";

export type RawServerFetchApiOptions = Omit<
  RawApiOptions,
  "cookies" | "withCredentials" | "signal"
> & {
  cacheProfileId: PublicCacheProfileId;
};

function policyThrow(
  code: ApiPolicyErrorCode,
  message: string,
  url: string,
): never {
  throwApiPolicyError(code, message, {
    url: redactApiErrorUrl(url),
    method: "GET",
    retried: false,
  });
}

function assertServerRawFetchOptions(
  url: string,
  options: RawServerFetchApiOptions,
): void {
  if (!options || options.cacheProfileId === undefined) {
    policyThrow("cache-profile-unknown", "cacheProfileId is required", url);
  }

  if ("signal" in options && (options as { signal?: unknown }).signal) {
    policyThrow(
      "invalid-option-combination",
      "signal is not allowed on serverRawFetch",
      url,
    );
  }
  if ("cookies" in options && (options as { cookies?: unknown }).cookies) {
    policyThrow(
      "invalid-option-combination",
      "cookies are not allowed on serverRawFetch",
      url,
    );
  }
  if (
    "withCredentials" in options &&
    (options as { withCredentials?: unknown }).withCredentials !== undefined
  ) {
    policyThrow(
      "invalid-option-combination",
      "withCredentials is not allowed on serverRawFetch",
      url,
    );
  }

  const auth = getHeader(options.headers, "authorization");
  const cookie = getHeader(options.headers, "cookie");
  if (auth || cookie) {
    policyThrow(
      "invalid-option-combination",
      "Authorization/Cookie headers are not allowed on serverRawFetch",
      url,
    );
  }
}

function resolveServerRawCacheOptions(
  url: string,
  options: RawServerFetchApiOptions,
): ResolvedPublicCacheOptions {
  try {
    return validatePublicCacheRequest({
      cacheProfileId: options.cacheProfileId,
      method: "GET",
      url,
      headers: options.headers,
    });
  } catch (error) {
    const code =
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof (error as { code: unknown }).code === "string"
        ? (error as { code: ApiPolicyErrorCode }).code
        : "cache-profile-unknown";
    policyThrow(code, "Public cache profile validation failed", url);
  }
}

/**
 * Server-only cached public GET. Options and cacheProfileId are required.
 * Rejects signal/cookies/withCredentials/Cookie/Authorization at runtime.
 */
export async function serverRawFetch<T>(
  url: string,
  options: RawServerFetchApiOptions,
): Promise<ApiResult<T>> {
  assertServerRawFetchOptions(url, options);
  const fetchOptions = resolveServerRawCacheOptions(url, options);
  const baseURL = options.baseURL ?? resolveDefaultApiBaseURL();

  return executeFetchCore<T>({
    method: "GET",
    url,
    baseURL,
    params: options.params,
    headers: options.headers,
    timeoutMs: options.timeout,
    cache: fetchOptions.cache,
    next: fetchOptions.next,
    mode: "raw",
    allowBody: false,
    redirect: "follow",
  });
}
