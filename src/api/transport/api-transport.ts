/**
 * Authenticated ApiTransport — native Fetch with runtime-bound refresh.
 * Isomorphic / client-safe. Must not import Next cookie APIs or writable server runtime adapters.
 */

import { ApiErrorCode } from "@/constants/api-error-code";
import { isServer } from "@/lib/utils/runtime";
import type { ApiResult } from "@/types/api";
import {
  isRefreshEligible,
  requestSentNonEmptyBearer,
} from "../auth/auth-refresh";
import type {
  AuthRuntimeAdapter,
  BrowserRefreshResult,
} from "../auth/auth-runtime";
import { createBrowserProxyRuntimeAdapter } from "../auth/browser-auth";
import {
  executeFetchCoreOutcome,
  type FailedHttpResponse,
  type HttpMethod,
  type ReplayableBody,
  resolveDefaultApiBaseURL,
  resolveTrustedOrigin,
} from "../core/fetch-core";
import {
  ApiAbortError,
  ApiHttpError,
  ApiNetworkError,
  ApiPolicyError,
  ApiRefreshRequiredError,
  ApiRequestReplayError,
  ApiResponseParseError,
  ApiTimeoutError,
  isApiHttpError,
  parseApiErrorEnvelope,
  redactApiErrorUrl,
  sanitizeApiErrorCause,
} from "../core/fetch-error";
import { mergeHeadersCaseInsensitive } from "../core/fetch-helpers";

export type BaseApiOptions = {
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  /**
   * Per-request timeout in ms. Overrides transport `timeoutMs` / fetch-core
   * authenticated default (10s). Used by long uploads (e.g. media 30s).
   */
  timeout?: number;
};

export type FetchApiOptions = BaseApiOptions & {
  params?: Record<string, string>;
};

export type MutationApiOptions = BaseApiOptions & {
  params?: Record<string, string>;
  /**
   * Default false. When true, gzip JSON POST/PUT/PATCH bodies once via
   * CompressionStream("gzip") into replayable bytes. Keeps Content-Type
   * application/json, sets Content-Encoding: gzip, does not set Content-Length.
   * FormData/file upload is never compressed. No caller enables this yet
   * (BE does not decompress gzip).
   */
  compress?: boolean;
};

export {
  isRefreshEligible,
  requestSentNonEmptyBearer,
  validateRotatedTokens,
} from "../auth/auth-refresh";
export type { AuthRuntimeAdapter } from "../auth/auth-runtime";

export type ApiTransport = {
  request<T>(init: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";
    url: string;
    data?: unknown;
    options?: FetchApiOptions | MutationApiOptions;
  }): Promise<ApiResult<T>>;
};

export type ApiErrorStorePush = (entry: {
  statusCode: number;
  appCode: number;
  message: string;
  url: string;
  method: string;
}) => void;

export type ApiTransportConfig = {
  baseURL?: string;
  timeoutMs?: number | false;
  runtime: AuthRuntimeAdapter;
  /** Browser-only; server must omit (never import Zustand into this module). */
  pushApiError?: ApiErrorStorePush;
};

function buildHttpError(
  failed: FailedHttpResponse,
  retried: boolean,
  cause?: unknown,
): ApiHttpError {
  // FE-owned message only — never copy BE body.message into error.message.
  // Raw body remains on response.data for code-based mappers.
  return new ApiHttpError({
    message: `HTTP ${failed.status}`,
    response: {
      status: failed.status,
      data: failed.data,
      headers: failed.headers,
    },
    request: {
      url: redactApiErrorUrl(failed.url),
      method: failed.method,
      retried,
    },
    cause: sanitizeApiErrorCause(cause),
  });
}

function reportApiError(
  error: unknown,
  meta: { url: string; method: string },
  pushApiError?: ApiErrorStorePush,
): void {
  let statusCode = 0;
  let appCode: number = ApiErrorCode.Unknown;
  let message = "Unknown Error";

  if (isApiHttpError(error)) {
    statusCode = error.response.status;
    const parsed = parseApiErrorEnvelope(error.response.data);
    appCode = parsed.code;
    // Never log/store BE body message — ignore error.message for HTTP errors.
    message = `HTTP ${statusCode}`;
  } else if (
    error instanceof ApiTimeoutError ||
    error instanceof ApiAbortError ||
    error instanceof ApiNetworkError ||
    error instanceof ApiResponseParseError
  ) {
    message = error.message;
  } else if (error instanceof ApiPolicyError) {
    console.error(
      `[API] ${meta.method} ${redactApiErrorUrl(meta.url)} → policy ${error.code}`,
    );
    return;
  } else if (error instanceof ApiRequestReplayError) {
    console.error(
      `[API] ${meta.method} ${redactApiErrorUrl(meta.url)} → replay error`,
    );
    return;
  } else if (error instanceof ApiRefreshRequiredError) {
    if (isServer()) {
      console.error(
        `[API] ${meta.method} ${redactApiErrorUrl(meta.url)} → refresh required`,
      );
    }
    return;
  }

  console.error(
    `[API] ${meta.method} ${redactApiErrorUrl(meta.url)} → HTTP ${statusCode} | appCode=${appCode} | ${message}`,
  );

  if (isServer() || !pushApiError) return;
  pushApiError({
    statusCode,
    appCode,
    message,
    url: redactApiErrorUrl(meta.url),
    method: meta.method,
  });
}

async function attachServerAuthorization(
  runtime: AuthRuntimeAdapter,
  headers: Record<string, string>,
): Promise<Record<string, string>> {
  if (
    runtime.kind !== "server-writable" &&
    runtime.kind !== "server-readonly"
  ) {
    return headers;
  }
  const bag = await runtime.readAuthCookies();
  if (bag.accessToken?.trim()) {
    return mergeHeadersCaseInsensitive(headers, {
      authorization: `Bearer ${bag.accessToken.trim()}`,
    });
  }
  return headers;
}

async function attemptRefresh(
  runtime: AuthRuntimeAdapter,
  failed: FailedHttpResponse,
): Promise<{ ok: true; accessToken: string } | { ok: false; cause?: unknown }> {
  if (
    runtime.kind === "server-readonly" ||
    runtime.kind === "server-no-request-context"
  ) {
    throw new ApiRefreshRequiredError({
      message: "Refresh requires a writable server boundary",
      request: {
        url: redactApiErrorUrl(failed.url),
        method: failed.method,
        retried: false,
      },
    });
  }

  if (runtime.kind === "browser-proxy") {
    const result: BrowserRefreshResult = await runtime.refresh();
    if (!result.ok || !result.accessToken.trim()) {
      return {
        ok: false,
        cause: result.ok === false ? result.cause : undefined,
      };
    }
    return { ok: true, accessToken: result.accessToken };
  }

  // server-writable
  const bag = await runtime.readAuthCookies();
  if (!bag.refreshToken?.trim() || !bag.sessionId?.trim()) {
    return { ok: false };
  }
  try {
    const refreshed = await runtime.refresh({
      refreshToken: bag.refreshToken,
      sessionId: bag.sessionId,
    });
    await runtime.persistRotatedSession(
      refreshed.tokens,
      refreshed.refreshMaxAge,
    );
    return { ok: true, accessToken: refreshed.tokens.access_token };
  } catch (error) {
    return { ok: false, cause: sanitizeApiErrorCause(error) };
  }
}

function createThrowReportedHttp(pushApiError?: ApiErrorStorePush) {
  return function throwReportedHttp(
    failed: FailedHttpResponse,
    retried: boolean,
    cause?: unknown,
  ): never {
    const error = buildHttpError(failed, retried, cause);
    reportApiError(
      error,
      { url: failed.url, method: failed.method },
      pushApiError,
    );
    throw error;
  };
}

export function createApiTransport(config: ApiTransportConfig): ApiTransport {
  const baseURL = resolveDefaultApiBaseURL(config.baseURL);
  const trustedOrigin = resolveTrustedOrigin(baseURL);
  const timeoutMs = config.timeoutMs;
  const runtime = config.runtime;
  const pushApiError = config.pushApiError;
  const throwReportedHttp = createThrowReportedHttp(pushApiError);

  return {
    async request<T>(init: {
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";
      url: string;
      data?: unknown;
      options?: FetchApiOptions | MutationApiOptions;
    }): Promise<ApiResult<T>> {
      const method = init.method as HttpMethod;
      const options = init.options ?? {};
      let headers = mergeHeadersCaseInsensitive(options.headers);
      headers = await attachServerAuthorization(runtime, headers);

      const outgoingHadBearer = requestSentNonEmptyBearer(headers);
      const credentials =
        runtime.kind === "browser-proxy" ? ("include" as const) : undefined;
      // Authenticated/private/mutation must never use browser HTTP cache.
      const cache = "no-store" as const;
      const redirect =
        runtime.kind === "browser-proxy"
          ? ("error" as const)
          : ("manual" as const);

      // Share one replayable body across refresh retry (gzip once per request).
      const bodyMemo: { current?: ReplayableBody } = {};

      const runAttempt = async (
        attemptHeaders: Record<string, string>,
        retried: boolean,
      ) =>
        executeFetchCoreOutcome<T>({
          method,
          url: init.url,
          baseURL,
          trustedOrigin,
          params: options.params,
          headers: attemptHeaders,
          cookies: options.cookies,
          data: init.data,
          timeoutMs: options.timeout ?? timeoutMs,
          credentials,
          cache,
          redirect,
          mode: "authenticated",
          retried,
          compress:
            method === "POST" || method === "PUT" || method === "PATCH"
              ? (options as MutationApiOptions).compress
              : undefined,
          bodyMemo,
        });

      const runAttemptReported = async (
        attemptHeaders: Record<string, string>,
        retried: boolean,
      ) => {
        try {
          return await runAttempt(attemptHeaders, retried);
        } catch (error) {
          // Timeout / network / abort / parse / policy — report before rethrow.
          reportApiError(error, { url: init.url, method }, pushApiError);
          throw error;
        }
      };

      const first = await runAttemptReported(headers, false);
      if (first.ok) return first.result;

      const failed = first.failed;
      const eligible = isRefreshEligible({
        status: failed.status,
        headers: failed.headers,
        outgoingHadBearer,
        retried: false,
      });

      if (!eligible) {
        return throwReportedHttp(failed, false);
      }

      let refreshResult: Awaited<ReturnType<typeof attemptRefresh>>;
      try {
        refreshResult = await attemptRefresh(runtime, failed);
      } catch (error) {
        if (error instanceof ApiRefreshRequiredError) {
          // SoT: server safe-log once; no browser toast/store.
          reportApiError(error, { url: init.url, method }, pushApiError);
          throw error;
        }
        return throwReportedHttp(failed, false, error);
      }

      if (!refreshResult.ok) {
        return throwReportedHttp(failed, false, refreshResult.cause);
      }

      const retryHeaders = mergeHeadersCaseInsensitive(headers, {
        authorization: `Bearer ${refreshResult.accessToken}`,
      });
      const second = await runAttemptReported(retryHeaders, true);
      if (second.ok) return second.result;
      return throwReportedHttp(second.failed, true);
    },
  };
}

export function createWritableServerApiTransport(
  config: Omit<ApiTransportConfig, "runtime"> & {
    runtime: Extract<AuthRuntimeAdapter, { kind: "server-writable" }>;
  },
): ApiTransport {
  return createApiTransport(config);
}

export function createReadonlyServerApiTransport(
  config: Omit<ApiTransportConfig, "runtime"> & {
    runtime: Extract<AuthRuntimeAdapter, { kind: "server-readonly" }>;
  },
): ApiTransport {
  return createApiTransport(config);
}

/** Browser singleton transport. */
export function createBrowserApiTransport(
  pushApiError: ApiErrorStorePush,
): ApiTransport {
  return createApiTransport({
    runtime: createBrowserProxyRuntimeAdapter(),
    pushApiError,
  });
}
