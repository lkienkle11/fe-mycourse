/**
 * Web-neutral header / cookie / URL helpers shared by Fetch transport.
 * Must not import third-party HTTP clients or Node-only request adapters.
 */

/**
 * Flattens response headers into a plain `Record<string, string>`.
 * Multi-value headers (arrays) are joined with ", ".
 * `set-cookie` is intentionally excluded — use `parseSetCookies` instead.
 */
export function normalizeHeaders(
  raw: Record<string, unknown> | Headers,
): Record<string, string> {
  const result: Record<string, string> = {};
  if (raw instanceof Headers) {
    raw.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") return;
      result[key.toLowerCase()] = value;
    });
    return result;
  }
  for (const [k, v] of Object.entries(raw)) {
    if (k.toLowerCase() === "set-cookie") continue;
    const key = k.toLowerCase();
    if (typeof v === "string") result[key] = v;
    else if (Array.isArray(v)) result[key] = (v as string[]).join(", ");
  }
  return result;
}

/**
 * Parses `Set-Cookie` header value(s) into a `Record<name, rawValue>`.
 * Cookie attributes (Path, HttpOnly, SameSite, …) are stripped.
 * Duplicate names keep the last occurrence.
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

/**
 * Parse the Max-Age directive (in seconds) for a specific cookie name from
 * the Set-Cookie response header(s).
 */
export function parseMaxAgeForCookie(
  setCookieHeader: string | string[] | undefined,
  cookieName: string,
): number | undefined {
  if (!setCookieHeader) return undefined;
  const entries = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];

  for (const entry of entries) {
    const nameValuePart = entry.split(";")[0] ?? "";
    const eqIdx = nameValuePart.indexOf("=");
    if (eqIdx === -1) continue;
    const name = nameValuePart.slice(0, eqIdx).trim();
    if (name.toLowerCase() !== cookieName.toLowerCase()) continue;

    const match = /(?:^|;)\s*[Mm]ax-[Aa]ge=(\d+)(?=\s*(?:;|$))/i.exec(entry);
    if (!match) continue;
    const value = Number.parseInt(match[1], 10);
    // Finite positive integer only; malformed suffix / non-positive → undefined.
    if (!Number.isFinite(value) || value <= 0) return undefined;
    return value;
  }
  return undefined;
}

/** Serialize cookies into a Cookie header value (server-side use). */
export function serializeCookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("; ");
}

/**
 * Absolute / network-path URL detection (`^([a-z][a-z\d+\-.]*:)?//`).
 */
export function isAbsoluteOrNetworkPathUrl(url: string): boolean {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}

/**
 * Combine base + relative URL. Empty relative URL keeps baseURL unchanged.
 */
export function combineURLs(baseURL: string, relativeURL: string): string {
  if (!relativeURL) return baseURL;
  if (isAbsoluteOrNetworkPathUrl(relativeURL)) return relativeURL;
  return `${baseURL.replace(/\/?\/$/, "")}/${relativeURL.replace(/^\/+/, "")}`;
}

/**
 * Query encoder with reserved-character restore (`:`, `$`, `,`, `+` for space).
 * Preserves insertion order; skips null/undefined.
 */
export function encodeQueryValue(value: string): string {
  return encodeURIComponent(value)
    .replace(/%3A/gi, ":")
    .replace(/%24/g, "$")
    .replace(/%2C/gi, ",")
    .replace(/%20/g, "+");
}

export function appendQueryParams(
  url: string,
  params?: Record<string, string | number | boolean | null | undefined>,
): string {
  if (!params) return url;
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    parts.push(
      `${encodeQueryValue(String(key))}=${encodeQueryValue(String(value))}`,
    );
  }
  if (parts.length === 0) return url;
  const hashIndex = url.indexOf("#");
  const withoutHash = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const separator = withoutHash.includes("?") ? "&" : "?";
  return `${withoutHash}${separator}${parts.join("&")}`;
}

/**
 * Parse Fetch response metadata (headers / Set-Cookie when available).
 * Browser: setCookieHeaders is undefined and cookies is {}.
 * Server: prefers Headers.getSetCookie() when available.
 */
export function parseFetchResponseMeta(response: Response): {
  headers: Record<string, string>;
  cookies: Record<string, string>;
  setCookieHeaders: string | string[] | undefined;
} {
  const headers = normalizeHeaders(response.headers);
  const isBrowser = typeof window !== "undefined";
  if (isBrowser) {
    return {
      headers,
      cookies: {},
      setCookieHeaders: undefined,
    };
  }

  const getSetCookie = (
    response.headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie;
  let setCookieHeaders: string | string[] | undefined;
  if (typeof getSetCookie === "function") {
    const list = getSetCookie.call(response.headers);
    setCookieHeaders = list.length > 0 ? list : undefined;
  } else {
    const single = response.headers.get("set-cookie");
    setCookieHeaders = single ?? undefined;
  }

  return {
    headers,
    cookies: parseSetCookies(setCookieHeaders),
    setCookieHeaders,
  };
}

/** Response body parser: JSON.parse every non-empty text. */
export async function parseResponseBodyJson(
  response: Response,
): Promise<unknown> {
  const text = await response.text();
  if (text === "") return "";
  try {
    return JSON.parse(text);
  } catch (error) {
    if (error instanceof SyntaxError) return text;
    throw error;
  }
}

/** Case-insensitive header merge into a plain record (lowercase keys). */
export function mergeHeadersCaseInsensitive(
  ...sources: Array<Record<string, string> | Headers | undefined>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const source of sources) {
    if (!source) continue;
    if (source instanceof Headers) {
      source.forEach((value, key) => {
        result[key.toLowerCase()] = value;
      });
      continue;
    }
    for (const [key, value] of Object.entries(source)) {
      result[key.toLowerCase()] = value;
    }
  }
  return result;
}

/** Delete a logical header name (case-insensitive) from a plain record. */
export function deleteHeader(
  headers: Record<string, string>,
  name: string,
): void {
  const target = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === target) delete headers[key];
  }
}

/** Read a logical header value case-insensitively. */
export function getHeader(
  headers: Record<string, string> | Headers | undefined,
  name: string,
): string | undefined {
  if (!headers) return undefined;
  if (headers instanceof Headers) {
    return headers.get(name) ?? undefined;
  }
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target) return value;
  }
  return undefined;
}
