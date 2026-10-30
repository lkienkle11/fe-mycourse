/**
 * Server-only auth cookie helpers and FromRequest transport factories.
 */

import "server-only";

import { cookies } from "next/headers";
import { API_PUBLIC_ROUTES } from "@/constants/api-route";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_ID_COOKIE,
} from "@/constants/auth-cookie";
import type { ApiResponse } from "@/types/api";
import type { RefreshTokenResponse } from "@/types/auth";
import {
  resolveDefaultApiBaseURL,
  resolveTrustedOrigin,
} from "../core/fetch-core";
import {
  ApiRefreshValidationError,
  isApiHttpError,
  sanitizeApiErrorCause,
} from "../core/fetch-error";
import { parseMaxAgeForCookie } from "../core/fetch-helpers";
import { type ApiMethods, createApiMethods } from "../core/methods";
import {
  type ApiTransport,
  type ApiTransportConfig,
  createApiTransport,
} from "../transport/api-transport";
import { validateRotatedTokens } from "./auth-refresh";
import type {
  AuthCookieBag,
  ClearAuthSessionFn,
  PersistRotatedAuthSessionFn,
  RefreshSessionInput,
  RefreshSessionResult,
} from "./auth-runtime";
import { rawPostRefreshUpstream } from "./refresh-upstream-raw";

const DEFAULT_TIMEOUT_MS = 10_000;

export async function readAuthCookiesFromRequest(): Promise<AuthCookieBag> {
  const store = await cookies();
  return {
    accessToken: store.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: store.get(REFRESH_TOKEN_COOKIE)?.value,
    sessionId: store.get(SESSION_ID_COOKIE)?.value,
  };
}

export function createPersistRotatedSessionFromRequest(): PersistRotatedAuthSessionFn {
  return async (tokens, refreshMaxAge) => {
    try {
      const { setAuthSessionCookies } = await import(
        "@/lib/utils/auth-session"
      );
      await setAuthSessionCookies({ tokens, refreshMaxAge });
    } catch (error) {
      throw new ApiRefreshValidationError({
        reason: "cookie-persist-failed",
        message: "Failed to persist rotated auth session",
        cause: sanitizeApiErrorCause(error),
      });
    }
  };
}

export function createClearSessionFromRequest(): ClearAuthSessionFn {
  return async () => {
    const { clearAuthSessionCookies } = await import(
      "@/lib/utils/auth-session"
    );
    await clearAuthSessionCookies();
  };
}

export async function refreshUpstreamSession(
  input: RefreshSessionInput,
  baseURL?: string,
): Promise<RefreshSessionResult> {
  const resolvedBase = resolveDefaultApiBaseURL(baseURL);
  try {
    const { data: envelope, setCookieHeaders } = await rawPostRefreshUpstream<
      ApiResponse<RefreshTokenResponse>
    >(resolvedBase + API_PUBLIC_ROUTES.auth.refresh, {
      refreshToken: input.refreshToken,
      sessionId: input.sessionId,
      baseURL: resolvedBase,
      timeoutMs: DEFAULT_TIMEOUT_MS,
    });

    const tokens = validateRotatedTokens(envelope?.data);
    const refreshMaxAge = parseMaxAgeForCookie(
      setCookieHeaders,
      REFRESH_TOKEN_COOKIE,
    );
    return {
      tokens,
      ...(refreshMaxAge !== undefined ? { refreshMaxAge } : {}),
    };
  } catch (error) {
    if (error instanceof ApiRefreshValidationError) throw error;
    if (isApiHttpError(error)) {
      throw new ApiRefreshValidationError({
        reason: "invalid-envelope",
        message: `Upstream refresh HTTP ${error.response.status}`,
        cause: sanitizeApiErrorCause(error),
        upstreamStatus: error.response.status,
      });
    }
    throw new ApiRefreshValidationError({
      reason: "invalid-envelope",
      message: "Upstream refresh failed",
      cause: sanitizeApiErrorCause(error),
    });
  }
}

export async function createWritableServerApiTransportFromRequest(
  config?: Omit<ApiTransportConfig, "runtime">,
): Promise<ApiTransport> {
  const baseURL = resolveDefaultApiBaseURL(config?.baseURL);
  return createApiTransport({
    ...config,
    baseURL,
    runtime: {
      kind: "server-writable",
      readAuthCookies: readAuthCookiesFromRequest,
      refresh: (input) => refreshUpstreamSession(input, baseURL),
      persistRotatedSession: createPersistRotatedSessionFromRequest(),
      clearSession: createClearSessionFromRequest(),
    },
  });
}

export async function createReadonlyServerApiTransportFromRequest(
  config?: Omit<ApiTransportConfig, "runtime">,
): Promise<ApiTransport> {
  const baseURL = resolveDefaultApiBaseURL(config?.baseURL);
  return createApiTransport({
    ...config,
    baseURL,
    runtime: {
      kind: "server-readonly",
      readAuthCookies: readAuthCookiesFromRequest,
    },
  });
}

/** Trusted origin helper re-export for server callers. */
export { resolveTrustedOrigin };

export async function createWritableServerApiMethods(): Promise<ApiMethods> {
  const transport = await createWritableServerApiTransportFromRequest();
  return createApiMethods(transport);
}
