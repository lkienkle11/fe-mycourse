import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  parseExactRefreshSuccessEnvelope,
  validateRotatedTokens,
} from "@/api/auth/auth-refresh";
import { rawPostRefreshUpstream } from "@/api/auth/refresh-upstream-raw";
import {
  ApiTimeoutError,
  isApiHttpError,
  parseApiErrorEnvelope,
} from "@/api/core/fetch-error";
import { ApiErrorCode } from "@/constants/api-error-code";
import { API_PUBLIC_ROUTES } from "@/constants/api-route";
import {
  refreshMaxAgeFromBeSetCookie,
  setAuthSessionCookies,
} from "@/lib/utils/auth-session";
import type { ApiResponse } from "@/types/api";
import type { RefreshTokenResponse } from "@/types/auth";

const DEFAULT_BASE_URL = "http://localhost:3000/api";
const DEFAULT_TIMEOUT_MS = 10_000;
const resolvedBaseURL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? DEFAULT_BASE_URL;

/** Allowlisted upstream codes safe to surface on the browser refresh proxy. */
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
): NextResponse<BrowserRefreshProxyError> {
  const safeCode = sanitizeRefreshProxyCode(code);
  return NextResponse.json(
    {
      code: safeCode,
      message: sanitizeRefreshProxyMessage(safeCode),
      data: null,
    },
    { status },
  );
}

/**
 * Browser-safe refresh proxy (PENDING-06):
 * - reads HttpOnly refresh/session cookies on Next server
 * - raw upstream refresh with cache: no-store
 * - requires all three rotated tokens before persist
 * - returns access_token-only success DTO to browser JS
 * - error responses use allowlisted codes + fixed safe messages only
 */
export async function POST(): Promise<
  NextResponse<BrowserRefreshProxySuccess | BrowserRefreshProxyError>
> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;
  const sessionId = cookieStore.get("session_id")?.value;

  if (!refreshToken?.trim() || !sessionId?.trim()) {
    return errorDto(401, ApiErrorCode.Unauthorized);
  }

  try {
    const { data: envelope, setCookieHeaders } = await rawPostRefreshUpstream<
      ApiResponse<RefreshTokenResponse>
    >(resolvedBaseURL + API_PUBLIC_ROUTES.auth.refresh, {
      refreshToken,
      sessionId,
      baseURL: resolvedBaseURL,
      timeoutMs: DEFAULT_TIMEOUT_MS,
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

    const refreshMaxAge = refreshMaxAgeFromBeSetCookie(setCookieHeaders);

    try {
      await setAuthSessionCookies({
        tokens,
        refreshMaxAge,
      });
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
        // Never forward raw BE message; only allowlisted codes + fixed copy.
        return errorDto(status, parsed.code);
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
