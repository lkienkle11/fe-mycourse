/**
 * Shared Axios header/cookie helpers for `methods.ts` and `raw-http.ts`.
 * Kept separate from `instance.ts` so refresh can use `raw-http` without cycles.
 */

import type { AxiosRequestConfig } from "axios";

export type CookieHeaderOptions = {
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  params?: Record<string, string>;
};

/**
 * Flattens Axios response headers into a plain `Record<string, string>`.
 * Multi-value headers (arrays) are joined with ", ".
 * `set-cookie` is intentionally excluded — use `parseSetCookies` instead.
 */
export function normalizeHeaders(
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

/**
 * Parses `Set-Cookie` header value(s) into a `Record<name, rawValue>`.
 * Cookie attributes (Path, HttpOnly, SameSite, …) are stripped.
 */
export function parseSetCookies(
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

/** Builds Axios config with optional query params, headers, and Cookie header. */
export function buildAxiosConfigWithCookies(
  options: CookieHeaderOptions,
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

/** Normalizes an Axios response into `ApiResult` header/cookie fields. */
export function parseAxiosResponseMeta(rawHeaders: Record<string, unknown>): {
  headers: Record<string, string>;
  cookies: Record<string, string>;
} {
  return {
    headers: normalizeHeaders(rawHeaders),
    cookies: parseSetCookies(
      rawHeaders["set-cookie"] as string | string[] | undefined,
    ),
  };
}
