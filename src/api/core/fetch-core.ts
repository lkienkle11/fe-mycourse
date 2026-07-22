/**
 * Fetch-core policy orchestrator shared by raw and authenticated transports.
 * The actual HTTP attempt is delegated to the Xior adapter; this module keeps
 * MyCourse-specific URL, body, timeout, redirect and error policy.
 */

import { isServer } from "@/lib/utils/runtime";
import type { ApiResult } from "@/types/api";
import {
  executeXiorOnce,
  type SharedAbortLifecycle,
  XiorHeaderResolutionError,
  type XiorRequestExecutor,
} from "../xior/client";
import {
  buildAuthenticatedBody,
  buildRawBody,
  type FetchCoreInit,
  type FetchCoreOutcome,
  isFormData,
  type ReplayableBody,
} from "./fetch-core-body";
import {
  ApiAbortError,
  type ApiErrorRequest,
  ApiHttpError,
  ApiNetworkError,
  type ApiPolicyErrorCode,
  ApiRequestReplayError,
  ApiResponseParseError,
  ApiTimeoutError,
  redactApiErrorUrl,
  throwApiPolicyError,
} from "./fetch-error";
import {
  appendQueryParams,
  combineURLs,
  deleteHeader,
  getHeader,
  isAbsoluteOrNetworkPathUrl,
  mergeHeadersCaseInsensitive,
  parseFetchResponseMeta,
  parseResponseBodyJson,
  serializeCookieHeader,
} from "./fetch-helpers";

export type {
  FailedHttpResponse,
  FetchCoreInit,
  FetchCoreMode,
  FetchCoreOutcome,
  FetchCoreRedirectMode,
  FetchCoreSuccess,
  HttpMethod,
  ReplayableBody,
} from "./fetch-core-body";

function defaultRequest(init: FetchCoreInit): ApiErrorRequest {
  return {
    url: redactApiErrorUrl(init.url),
    method: init.method,
    retried: Boolean(init.retried),
  };
}

function policyError(
  code: ApiPolicyErrorCode,
  message: string,
  request: ApiErrorRequest,
  cause?: unknown,
): never {
  throwApiPolicyError(code, message, request, cause);
}

function resolveTimeoutMs(
  timeoutMs: number | false | undefined,
  mode: FetchCoreInit["mode"],
): number | false {
  if (timeoutMs === false) return false;
  if (timeoutMs === 0) return false;
  if (timeoutMs === undefined) {
    return mode === "authenticated" ? 10_000 : false;
  }
  if (
    typeof timeoutMs !== "number" ||
    !Number.isFinite(timeoutMs) ||
    timeoutMs < 0
  ) {
    return Number.NaN;
  }
  return timeoutMs;
}

function resolveAbsoluteUrl(
  requestUrl: string,
  baseURL: string | undefined,
  request: ApiErrorRequest,
): URL {
  let combined = requestUrl;
  if (baseURL && !isAbsoluteOrNetworkPathUrl(requestUrl)) {
    combined = combineURLs(baseURL, requestUrl);
  } else if (
    baseURL &&
    requestUrl.startsWith("//") &&
    !/^[a-z][a-z\d+\-.]*:/i.test(requestUrl)
  ) {
    try {
      const base = new URL(baseURL);
      combined = `${base.protocol}${requestUrl}`;
    } catch {
      combined = requestUrl;
    }
  }

  let parsed: URL;
  try {
    parsed = new URL(combined);
  } catch {
    policyError("invalid-url", "Invalid request URL", request);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    policyError("unsupported-protocol", "Only http/https allowed", request);
  }
  if (parsed.username || parsed.password) {
    policyError(
      "embedded-credentials",
      "Embedded URL credentials are forbidden",
      request,
    );
  }
  return parsed;
}

function assertTrustedOrigin(
  url: URL,
  trustedOrigin: string | undefined,
  request: ApiErrorRequest,
): void {
  if (!trustedOrigin) return;
  let trusted: URL;
  try {
    trusted = new URL(trustedOrigin);
  } catch {
    policyError("untrusted-origin", "Trusted origin is invalid", request);
  }
  if (url.origin !== trusted.origin) {
    policyError("untrusted-origin", "Request origin is not trusted", request);
  }
}

const FOLLOW_REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const REDIRECT_BODY_HEADERS =
  "content-type content-length content-encoding content-language content-location".split(
    " ",
  );

async function releaseAbandonedRedirectBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // Cancel failures must not mask typed redirect/policy errors.
  }
}

async function followServerRedirects(
  init: FetchCoreInit,
  startUrl: string,
  body: ReplayableBody,
  headers: Record<string, string>,
  executeOnce: XiorRequestExecutor,
  lifecycle: SharedAbortLifecycle,
): Promise<Response> {
  const maxHops = init.maxRedirectHops ?? 5;
  const visited = new Set<string>([startUrl]);
  const currentHeaders = { ...headers };
  const retried = Boolean(init.retried);
  let currentUrl = startUrl;
  let currentMethod = init.method;
  let dropBody = false;
  let hops = 0;
  const request = (url = currentUrl, method = currentMethod) => ({
    url: redactApiErrorUrl(url),
    method,
    retried,
  });
  const fail = (code: ApiPolicyErrorCode, message: string, url = currentUrl) =>
    throwApiPolicyError(code, message, request(url));

  while (true) {
    const response = await executeOnce(
      { ...init, method: currentMethod, redirect: "manual", timeoutMs: false },
      currentUrl,
      {
        ...body,
        bodyForAttempt: (attempt) =>
          dropBody ? null : body.bodyForAttempt(attempt),
      },
      currentHeaders,
      init.retried ? 1 : 0,
      lifecycle,
    );

    if (response.status < 300 || response.status >= 400) return response;

    // Only hop statuses become redirect locations. 304 and other 3xx
    // responses remain the final response.
    if (!FOLLOW_REDIRECT_STATUSES.has(response.status)) return response;

    hops += 1;
    if (hops > maxHops) {
      await releaseAbandonedRedirectBody(response);
      fail("redirect-hop-limit", "Redirect hop limit exceeded");
    }

    const location = response.headers.get("location");
    if (!location) {
      await releaseAbandonedRedirectBody(response);
      fail("redirect-location-missing", "Redirect Location missing");
    }

    let nextUrl = new URL(currentUrl);
    try {
      try {
        nextUrl = new URL(location as string, currentUrl);
      } catch {
        fail("redirect-location-invalid", "Redirect Location invalid");
      }
      if (nextUrl.protocol !== "http:" && nextUrl.protocol !== "https:") {
        fail(
          "unsupported-protocol",
          "Redirect target protocol unsupported",
          nextUrl.toString(),
        );
      }
      if (nextUrl.username || nextUrl.password) {
        fail(
          "embedded-credentials",
          "Redirect target has embedded credentials",
          nextUrl.toString(),
        );
      }
      assertTrustedOrigin(
        nextUrl,
        init.trustedOrigin,
        request(nextUrl.toString()),
      );
    } catch (error) {
      await releaseAbandonedRedirectBody(response);
      throw error;
    }
    const nextHref = nextUrl.toString();
    if (visited.has(nextHref)) {
      await releaseAbandonedRedirectBody(response);
      fail("redirect-loop", "Redirect loop detected", nextHref);
    }
    visited.add(nextHref);

    const hopStatus = response.status;
    await releaseAbandonedRedirectBody(response);

    const bodylessMethod = currentMethod === "GET" || currentMethod === "HEAD";
    const rewriteToGet =
      (hopStatus === 303 && !bodylessMethod) ||
      ((hopStatus === 301 || hopStatus === 302) && currentMethod === "POST");
    const nextMethod = rewriteToGet ? "GET" : currentMethod;
    const nextDropBody = bodylessMethod || hopStatus === 303 || rewriteToGet;

    if (nextDropBody) {
      for (const header of REDIRECT_BODY_HEADERS) {
        deleteHeader(currentHeaders, header);
      }
    } else if (!body.replayable) {
      throw new ApiRequestReplayError({
        message: "Redirect requires replayable body",
        request: request(nextHref, nextMethod),
      });
    }
    currentMethod = nextMethod;
    dropBody = nextDropBody;
    currentUrl = nextHref;
  }
}

function composeAbortSignal(
  caller: AbortSignal | undefined,
  timeoutMs: number | false,
  request: ApiErrorRequest,
): {
  signal: AbortSignal | undefined;
  cleanup: () => void;
  getAbortKind: () => "caller" | "timeout" | null;
} {
  if (caller?.aborted) {
    throw new ApiAbortError({
      message: "Request aborted before network",
      request,
      cause: caller.reason,
    });
  }

  if (timeoutMs === false && !caller) {
    return {
      signal: undefined,
      cleanup: () => {},
      getAbortKind: () => null,
    };
  }

  const controller = new AbortController();
  let abortKind: "caller" | "timeout" | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const onCallerAbort = () => {
    if (abortKind) return;
    abortKind = "caller";
    controller.abort(caller?.reason);
  };

  if (caller) {
    caller.addEventListener("abort", onCallerAbort, { once: true });
  }

  if (timeoutMs !== false) {
    timer = setTimeout(() => {
      if (abortKind) return;
      abortKind = "timeout";
      controller.abort();
    }, timeoutMs);
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      if (timer !== undefined) clearTimeout(timer);
      if (caller) caller.removeEventListener("abort", onCallerAbort);
    },
    getAbortKind: () => abortKind,
  };
}

function classifyFetchFailure(
  error: unknown,
  abortKind: "caller" | "timeout" | null,
  request: ApiErrorRequest,
  redirectMode?: FetchCoreInit["redirect"],
): never {
  if (abortKind === "caller") {
    throw new ApiAbortError({
      message: "Request aborted",
      request,
      cause: error,
    });
  }
  if (abortKind === "timeout") {
    throw new ApiTimeoutError({
      message: "Request timed out",
      request,
      cause: error,
    });
  }
  if (error instanceof ApiAbortError || error instanceof ApiTimeoutError) {
    throw error;
  }
  if (
    redirectMode === "error" &&
    error instanceof TypeError &&
    /redirect/i.test(error.message)
  ) {
    throw new ApiNetworkError({
      message: "Redirect rejected",
      request,
      cause: error,
    });
  }
  if (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  ) {
    throw new ApiAbortError({
      message: "Request aborted",
      request,
      cause: error,
    });
  }
  throw new ApiNetworkError({
    message: "Network request failed",
    request,
    cause: error,
  });
}

/**
 * Execute one Xior-backed request and return ApiResult on 2xx.
 * Non-2xx responses throw ApiHttpError with parsed metadata (raw path).
 */

async function readResponseData(
  response: Response,
  request: ApiErrorRequest,
  getAbortKind: () => "caller" | "timeout" | null,
): Promise<unknown> {
  try {
    return await parseResponseBodyJson(response);
  } catch (error) {
    if (error instanceof SyntaxError) return "";
    if (error instanceof ApiAbortError || error instanceof ApiTimeoutError) {
      throw error;
    }
    // Body-read abort/timeout must follow first-writer-wins abort kind
    // (not wrap as ApiResponseParseError).
    const abortKind = getAbortKind();
    if (
      abortKind === "caller" ||
      abortKind === "timeout" ||
      (error instanceof DOMException &&
        (error.name === "AbortError" || error.name === "TimeoutError"))
    ) {
      classifyFetchFailure(error, abortKind, request);
    }
    throw new ApiResponseParseError({
      message: "Failed to read response body",
      request,
      cause: error,
    });
  }
}

function assertValidCallerCookieHeader(
  value: string,
  request: ApiErrorRequest,
): void {
  if (/[\r\n\0]/.test(value)) {
    policyError(
      "invalid-cookie-header",
      "Caller Cookie header contains control characters",
      request,
    );
  }
}

function buildRequestHeaders(
  init: FetchCoreInit,
  body: ReplayableBody,
  request: ApiErrorRequest,
): Record<string, string> {
  let headers = mergeHeadersCaseInsensitive(body.bodyHeaders);
  if (isFormData(init.data)) deleteHeader(headers, "content-type");

  // Generated cookies first, then caller headers (caller Cookie may overwrite).
  if (isServer() && init.cookies && Object.keys(init.cookies).length > 0) {
    const generated = serializeCookieHeader(init.cookies);
    if (generated) {
      headers = mergeHeadersCaseInsensitive(headers, { cookie: generated });
    }
  }

  if (init.headers) {
    const callerCookie =
      getHeader(init.headers, "cookie") ?? getHeader(init.headers, "Cookie");
    if (callerCookie !== undefined) {
      assertValidCallerCookieHeader(callerCookie, request);
    }
    headers = mergeHeadersCaseInsensitive(headers, init.headers);
  }

  if (!isServer()) deleteHeader(headers, "cookie");

  // Gzip body: caller must not override Content-Encoding or keep an
  // uncompressed Content-Length (RequestContentLengthMismatchError risk).
  const bodyEncoding = getHeader(body.bodyHeaders, "content-encoding");
  if (bodyEncoding?.toLowerCase() === "gzip") {
    headers["content-encoding"] = "gzip";
    deleteHeader(headers, "content-length");
  }

  return headers;
}

export async function executeFetchCore<T>(
  init: FetchCoreInit,
): Promise<ApiResult<T>> {
  const outcome = await executeFetchCoreOutcome<T>(init);
  if (outcome.ok) return outcome.result;
  throw new ApiHttpError({
    message: `HTTP ${outcome.failed.status}`,
    response: {
      status: outcome.failed.status,
      data: outcome.failed.data,
      headers: outcome.failed.headers,
    },
    request: {
      url: redactApiErrorUrl(outcome.failed.url),
      method: outcome.failed.method,
      retried: Boolean(init.retried),
    },
  });
}

type PreparedFetchCore = {
  init: FetchCoreInit;
  resolvedUrl: string;
  request: ApiErrorRequest;
  body: ReplayableBody;
  headers: Record<string, string>;
  redirect: NonNullable<FetchCoreInit["redirect"]>;
  lifecycle: SharedAbortLifecycle;
  cleanup: () => void;
};

type ResponseMeta = ReturnType<typeof parseFetchResponseMeta>;

function resolveAllowBody(init: FetchCoreInit): boolean {
  return (
    init.allowBody ??
    !(
      init.method === "GET" ||
      init.method === "HEAD" ||
      init.method === "DELETE" ||
      init.method === "OPTIONS"
    )
  );
}

function resolveRedirectMode(
  init: FetchCoreInit,
): NonNullable<FetchCoreInit["redirect"]> {
  return (
    init.redirect ??
    (init.mode === "authenticated"
      ? isServer()
        ? "manual"
        : "error"
      : "follow")
  );
}

async function prepareFetchCoreRequest(
  init: FetchCoreInit,
): Promise<PreparedFetchCore> {
  const provisionalRequest = defaultRequest(init);
  const timeoutCheck = resolveTimeoutMs(init.timeoutMs, init.mode);
  if (Number.isNaN(timeoutCheck as number)) {
    policyError("invalid-timeout", "Invalid timeout value", provisionalRequest);
  }

  const absolute = resolveAbsoluteUrl(
    appendQueryParams(init.url, init.params),
    init.baseURL,
    provisionalRequest,
  );
  assertTrustedOrigin(absolute, init.trustedOrigin, {
    ...provisionalRequest,
    url: redactApiErrorUrl(absolute.toString()),
  });
  const resolvedUrl = absolute.toString();
  const request: ApiErrorRequest = {
    url: redactApiErrorUrl(resolvedUrl),
    method: init.method,
    retried: Boolean(init.retried),
  };

  const overallTimeout = resolveTimeoutMs(init.timeoutMs, init.mode);
  if (Number.isNaN(overallTimeout as number)) {
    policyError("invalid-timeout", "Invalid timeout value", request);
  }
  // Arm abort/timeout before body build so gzip can honor the deadline.
  const lifecycleBundle = composeAbortSignal(
    init.signal,
    overallTimeout,
    request,
  );

  try {
    const allowBody = resolveAllowBody(init);
    const compress = Boolean(init.compress);
    let body = init.bodyMemo?.current;
    if (!body) {
      body =
        init.mode === "authenticated"
          ? await buildAuthenticatedBody(
              init.data,
              allowBody,
              request,
              compress,
              lifecycleBundle.signal,
            )
          : await buildRawBody(
              init.data,
              allowBody,
              request,
              compress,
              lifecycleBundle.signal,
            );
      if (init.bodyMemo) {
        init.bodyMemo.current = body;
      }
    }

    return {
      init,
      resolvedUrl,
      request,
      body,
      headers: buildRequestHeaders(init, body, request),
      redirect: resolveRedirectMode(init),
      lifecycle: {
        signal: lifecycleBundle.signal,
        getAbortKind: lifecycleBundle.getAbortKind,
      },
      cleanup: lifecycleBundle.cleanup,
    };
  } catch (error) {
    lifecycleBundle.cleanup();
    const abortKind = lifecycleBundle.getAbortKind();
    if (
      abortKind === "caller" ||
      abortKind === "timeout" ||
      (error instanceof DOMException &&
        (error.name === "AbortError" || error.name === "TimeoutError"))
    ) {
      classifyFetchFailure(error, abortKind, request);
    }
    throw error;
  }
}

async function dispatchFetchResponse(
  prepared: PreparedFetchCore,
  executeXiorRequest: XiorRequestExecutor,
): Promise<Response> {
  const { init, resolvedUrl, body, headers, redirect, lifecycle } = prepared;

  const executeAttempt = async (
    attemptInit: FetchCoreInit,
    attemptUrl: string,
    attemptBody: ReplayableBody,
    attemptHeaders: Record<string, string>,
    attempt: 0 | 1,
    attemptLifecycle: SharedAbortLifecycle,
  ): Promise<Response> => {
    try {
      return await executeXiorRequest(
        attemptInit,
        attemptUrl,
        attemptBody,
        attemptHeaders,
        attempt,
        attemptLifecycle,
      );
    } catch (error) {
      if (error instanceof XiorHeaderResolutionError) {
        throw error.original;
      }
      classifyFetchFailure(
        error,
        attemptLifecycle.getAbortKind(),
        {
          url: redactApiErrorUrl(attemptUrl),
          method: attemptInit.method,
          retried: Boolean(attemptInit.retried) || attempt === 1,
        },
        attemptInit.redirect,
      );
    }
  };

  if (init.mode === "authenticated" && isServer() && redirect === "manual") {
    return followServerRedirects(
      { ...init, redirect: "manual", timeoutMs: false },
      resolvedUrl,
      body,
      headers,
      executeAttempt,
      lifecycle,
    );
  }

  return executeAttempt(
    { ...init, redirect, timeoutMs: false },
    resolvedUrl,
    body,
    headers,
    init.retried ? 1 : 0,
    lifecycle,
  );
}

function toFetchCoreOutcome<T>(
  response: Response,
  data: unknown,
  meta: ResponseMeta,
  resolvedUrl: string,
  method: FetchCoreInit["method"],
): FetchCoreOutcome<T> {
  if (response.ok) {
    return {
      ok: true,
      result: {
        data: data as T,
        statusCode: response.status,
        headers: meta.headers,
        cookies: meta.cookies,
        setCookieHeaders: meta.setCookieHeaders,
      },
    };
  }

  return {
    ok: false,
    failed: {
      status: response.status,
      data,
      headers: meta.headers,
      cookies: meta.cookies,
      setCookieHeaders: meta.setCookieHeaders,
      url: resolvedUrl,
      method,
    },
  };
}

/**
 * Execute Fetch and return either success ApiResult or immutable failed descriptor.
 */
export async function executeFetchCoreOutcome<T>(
  init: FetchCoreInit,
): Promise<FetchCoreOutcome<T>> {
  return executeFetchCoreOutcomeWithExecutor(init, executeXiorOnce);
}

/** Internal authenticated entry point; public helpers keep their signatures. */
export async function executeFetchCoreOutcomeWithExecutor<T>(
  init: FetchCoreInit,
  executeXiorRequest: XiorRequestExecutor,
): Promise<FetchCoreOutcome<T>> {
  const prepared = await prepareFetchCoreRequest(init);
  try {
    const response = await dispatchFetchResponse(prepared, executeXiorRequest);
    const meta = parseFetchResponseMeta(response);
    const data = await readResponseData(
      response,
      prepared.request,
      prepared.lifecycle.getAbortKind,
    );
    return toFetchCoreOutcome(
      response,
      data,
      meta,
      prepared.resolvedUrl,
      init.method,
    );
  } finally {
    prepared.cleanup();
  }
}

export function resolveDefaultApiBaseURL(explicit?: string): string {
  return (
    explicit ??
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.API_URL ??
    "http://localhost:3000/api"
  );
}

export function resolveTrustedOrigin(baseURL: string): string {
  try {
    return new URL(baseURL).origin;
  } catch (cause) {
    policyError(
      "untrusted-origin",
      "Trusted origin is invalid",
      { url: redactApiErrorUrl(baseURL), method: "GET", retried: false },
      cause,
    );
  }
}
