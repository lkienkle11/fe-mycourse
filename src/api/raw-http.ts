/**
 * Bare Axios helpers — no shared `apiInstance`, no interceptors.
 * Safe for `instance.ts` (e.g. token refresh) without importing `methods.ts`.
 */

import axios, { type AxiosRequestConfig } from "axios";
import type { ApiResult } from "@/types/api";

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/** Query-only GET / OPTIONS-style extras mirror `FetchApiOptions` naming. */
export type RawFetchApiOptions = RawApiOptions;

/** POST / PUT / DELETE share the same option bag as mutations. */
export type RawMutationApiOptions = RawApiOptions;

export interface RawApiOptions {
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  params?: Record<string, string>;
  timeout?: number;
  withCredentials?: boolean;
  baseURL?: string;
  signal?: AbortSignal;
}

// ---------------------------------------------------------------------------
// Internal helpers (duplicated from methods.ts to avoid importing instance)
// ---------------------------------------------------------------------------

function normalizeHeaders(
  raw: Record<string, unknown>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k.toLowerCase() === "set-cookie") continue;
    if (typeof v === "string") result[k] = v;
    else if (Array.isArray(v)) result[k] = (v as string[]).join(", ");
  }
  return result;
}

function parseSetCookies(
  raw: string | string[] | undefined,
): Record<string, string> {
  if (!raw) return {};
  const result: Record<string, string> = {};
  for (const entry of Array.isArray(raw) ? raw : [raw]) {
    const [pair] = entry.split(";");
    const eqIdx = pair.indexOf("=");
    if (eqIdx === -1) continue;
    result[pair.slice(0, eqIdx).trim()] = pair.slice(eqIdx + 1).trim();
  }
  return result;
}

function buildAxiosConfig(
  options: Omit<
    RawApiOptions,
    "timeout" | "withCredentials" | "signal" | "baseURL"
  >,
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

function toAxiosConfig(options: RawApiOptions): AxiosRequestConfig {
  const { timeout, withCredentials, signal, baseURL, ...rest } = options;
  return {
    ...buildAxiosConfig(rest),
    ...(timeout !== undefined && { timeout }),
    ...(withCredentials !== undefined && { withCredentials }),
    ...(signal !== undefined && { signal }),
    ...(baseURL !== undefined && { baseURL }),
  };
}

// ---------------------------------------------------------------------------
// Public raw methods
// ---------------------------------------------------------------------------

export async function rawFetch<T>(
  url: string,
  options: RawFetchApiOptions = {},
): Promise<ApiResult<T>> {
  const {
    data,
    status: statusCode,
    headers: rawHeaders,
  } = await axios.get<T>(url, toAxiosConfig(options));

  return {
    data,
    statusCode,
    headers: normalizeHeaders(rawHeaders as Record<string, unknown>),
    cookies: parseSetCookies(
      rawHeaders["set-cookie"] as string | string[] | undefined,
    ),
  };
}

export async function rawPost<T, D = unknown>(
  url: string,
  data?: D,
  options: RawMutationApiOptions = {},
): Promise<ApiResult<T>> {
  const {
    data: responseData,
    status: statusCode,
    headers: rawHeaders,
  } = await axios.post<T>(url, data, toAxiosConfig(options));

  return {
    data: responseData,
    statusCode,
    headers: normalizeHeaders(rawHeaders as Record<string, unknown>),
    cookies: parseSetCookies(
      rawHeaders["set-cookie"] as string | string[] | undefined,
    ),
  };
}

export async function rawPut<T, D = unknown>(
  url: string,
  data?: D,
  options: RawMutationApiOptions = {},
): Promise<ApiResult<T>> {
  const {
    data: responseData,
    status: statusCode,
    headers: rawHeaders,
  } = await axios.put<T>(url, data, toAxiosConfig(options));

  return {
    data: responseData,
    statusCode,
    headers: normalizeHeaders(rawHeaders as Record<string, unknown>),
    cookies: parseSetCookies(
      rawHeaders["set-cookie"] as string | string[] | undefined,
    ),
  };
}

export async function rawDelete<T>(
  url: string,
  options: RawMutationApiOptions = {},
): Promise<ApiResult<T>> {
  const {
    data,
    status: statusCode,
    headers: rawHeaders,
  } = await axios.delete<T>(url, toAxiosConfig(options));

  return {
    data: data as T,
    statusCode,
    headers: normalizeHeaders(rawHeaders as Record<string, unknown>),
    cookies: parseSetCookies(
      rawHeaders["set-cookie"] as string | string[] | undefined,
    ),
  };
}

export async function rawOptions<T>(
  url: string,
  options: RawFetchApiOptions = {},
): Promise<ApiResult<T>> {
  const {
    data,
    status: statusCode,
    headers: rawHeaders,
  } = await axios.request<T>({
    url,
    method: "OPTIONS",
    ...toAxiosConfig(options),
  });

  return {
    data: data as T,
    statusCode,
    headers: normalizeHeaders(rawHeaders as Record<string, unknown>),
    cookies: parseSetCookies(
      rawHeaders["set-cookie"] as string | string[] | undefined,
    ),
  };
}
