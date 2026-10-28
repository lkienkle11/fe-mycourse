import { NextResponse } from "next/server";
import { ApiErrorCode } from "@/constants/api-error-code";
import { API_PUBLIC_ROUTES } from "@/constants/api-route";
import { REFRESH_TOKEN_COOKIE } from "@/constants/auth-cookie";
import type { ApiResponse } from "@/types/api";
import type { RefreshTokenResponse } from "@/types/auth";
import {
  ApiTimeoutError,
  isApiHttpError,
  parseApiErrorEnvelope,
} from "../core/fetch-error";
import { parseMaxAgeForCookie } from "../core/fetch-helpers";
import {
  isDeadSessionRefreshStatus,
  parseExactRefreshSuccessEnvelope,
  validateRotatedTokens,
} from "./auth-refresh";
import type {
  ClearAuthSessionFn,
  PersistRotatedAuthSessionFn,
  ReadAuthCookiesFn,
} from "./auth-runtime";
import { rawPostRefreshUpstream } from "./refresh-upstream-raw";

const REFRESH_PROXY_ALLOWED_CODES = new Set<number>([
  ApiErrorCode.Unknown,
  ApiErrorCode.BadRequest,
  ApiErrorCode.Unauthorized,
  ApiErrorCode.Forbidden,
  ApiErrorCode.TooManyRequests,
  ApiErrorCode.InvalidSession,
  ApiErrorCode.RefreshTokenExpired,
  ApiErrorCode.InternalError,
]);

const REFRESH_PROXY_SAFE_MESSAGES: Record<number, string> = {
  [ApiErrorCode.BadRequest]: "Refresh request was invalid",
  [ApiErrorCode.Unauthorized]: "Refresh session unauthorized",
  [ApiErrorCode.Forbidden]: "Refresh session forbidden",
  [ApiErrorCode.TooManyRequests]: "Too many refresh attempts",
  [ApiErrorCode.InvalidSession]: "Invalid refresh session",
  [ApiErrorCode.RefreshTokenExpired]: "Refresh session expired",
  [ApiErrorCode.InternalError]: "Refresh upstream error",
  [ApiErrorCode.Unknown]: "Refresh request failed",
};

type BrowserRefreshProxySuccess = {
  code: number;
  message: string;
  data: { access_token: string };
};

type BrowserRefreshProxyError = {
  code: number;
  message: string;
  data: null;
  /** Present only when the proxy removed the session cookies. */
  session_cleared?: true;
};

export type RefreshProxyResponse = NextResponse<
  BrowserRefreshProxySuccess | BrowserRefreshProxyError
>;

export type RefreshProxyDeps = {
  readAuthCookies: ReadAuthCookiesFn;
  persistSession: PersistRotatedAuthSessionFn;
  clearSession: ClearAuthSessionFn;
  baseURL: string;
  timeoutMs: number;
};

function sanitizeRefreshProxyCode(code: unknown): number {
  return typeof code === "number" && REFRESH_PROXY_ALLOWED_CODES.has(code)
    ? code
    : ApiErrorCode.Unknown;
}

function sanitizeRefreshProxyMessage(code: number): string {
  return REFRESH_PROXY_SAFE_MESSAGES[code] ?? "Refresh request failed";
}

function errorDto(
  status: number,
  code: number = ApiErrorCode.Unknown,
  sessionCleared = false,
): NextResponse<BrowserRefreshProxyError> {
  const safeCode = sanitizeRefreshProxyCode(code);
  return NextResponse.json(
    {
      code: safeCode,
      message: sanitizeRefreshProxyMessage(safeCode),
      data: null,
      ...(sessionCleared ? { session_cleared: true as const } : {}),
    },
    { status },
  );
}

async function tryClearSession(
  clearSession: ClearAuthSessionFn,
): Promise<boolean> {
  try {
    await clearSession();
    return true;
  } catch {
    return false;
  }
}

/**
 * Browser-safe refresh proxy (PENDING-06):
 * - reads HttpOnly refresh/session cookies on Next server
 * - raw upstream refresh with cache: no-store
 * - requires all three rotated tokens before persist
 * - returns access_token-only success DTO to browser JS
 * - error responses use allowlisted codes + fixed safe messages only
 */
export async function handleRefreshProxy(
  deps: RefreshProxyDeps,
): Promise<RefreshProxyResponse> {
  const { refreshToken, sessionId } = await deps.readAuthCookies();

  if (!refreshToken?.trim() || !sessionId?.trim()) {
    return errorDto(401, ApiErrorCode.Unauthorized);
  }

  try {
    const { data: envelope, setCookieHeaders } = await rawPostRefreshUpstream<
      ApiResponse<RefreshTokenResponse>
    >(deps.baseURL + API_PUBLIC_ROUTES.auth.refresh, {
      refreshToken,
      sessionId,
      baseURL: deps.baseURL,
      timeoutMs: deps.timeoutMs,
    });

    let successEnvelope: ReturnType<typeof parseExactRefreshSuccessEnvelope>;
    try {
      successEnvelope = parseExactRefreshSuccessEnvelope(envelope);
    } catch {
      return errorDto(502, ApiErrorCode.Unknown);
    }

    let tokens: ReturnType<typeof validateRotatedTokens>;
    try {
      tokens = validateRotatedTokens(successEnvelope.data);
    } catch {
      return errorDto(502, ApiErrorCode.Unknown);
    }

    const refreshMaxAge = parseMaxAgeForCookie(
      setCookieHeaders,
      REFRESH_TOKEN_COOKIE,
    );

    try {
      await deps.persistSession(tokens, refreshMaxAge);
    } catch {
      return errorDto(500, ApiErrorCode.InternalError);
    }

    return NextResponse.json(
      {
        code: successEnvelope.code,
        message: successEnvelope.message,
        data: { access_token: tokens.access_token },
      },
      { status: 200 },
    );
  } catch (error) {
    if (isApiHttpError(error)) {
      const status = error.response.status;
      const parsed = parseApiErrorEnvelope(error.response.data);
      if (status >= 400 && status <= 599) {
        const sessionCleared = isDeadSessionRefreshStatus(status)
          ? await tryClearSession(deps.clearSession)
          : false;
        // Never forward raw BE message; only allowlisted codes + fixed copy.
        return errorDto(status, parsed.code, sessionCleared);
      }
    }

    // Typed timeout → 504. Do not classify via regex on error.message
    // ("Request timed out" does not match /timeout/i).
    if (error instanceof ApiTimeoutError) {
      return errorDto(504, ApiErrorCode.Unknown);
    }
    return errorDto(502, ApiErrorCode.Unknown);
  }
}
