/**
 * Bare Axios helpers — no shared `apiInstance`, no interceptors.
 * Safe for `instance.ts` (e.g. token refresh) without importing `methods.ts`.
 */

import axios, { type AxiosRequestConfig } from "axios";
import type { ApiResult } from "@/types/api";
import {
  buildAxiosConfigWithCookies,
  parseAxiosResponseMeta,
} from "./axios-helpers";

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

function toAxiosConfig(options: RawApiOptions): AxiosRequestConfig {
  const { timeout, withCredentials, signal, baseURL, ...rest } = options;
  return {
    ...buildAxiosConfigWithCookies(rest),
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
    ...parseAxiosResponseMeta(rawHeaders as Record<string, unknown>),
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
    ...parseAxiosResponseMeta(rawHeaders as Record<string, unknown>),
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
    ...parseAxiosResponseMeta(rawHeaders as Record<string, unknown>),
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
    ...parseAxiosResponseMeta(rawHeaders as Record<string, unknown>),
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
    ...parseAxiosResponseMeta(rawHeaders as Record<string, unknown>),
  };
}
