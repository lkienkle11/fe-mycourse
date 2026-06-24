import axios, { type AxiosError } from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
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

/**
 * Browser-safe refresh proxy:
 * - reads HttpOnly refresh/session cookies on Next server
 * - sends explicit refresh headers to BE (avoids duplicate-cookie ambiguity)
 * - reads Max-Age from BE Set-Cookie (authoritative TTL from BE token_ttl.go)
 * - falls back to auth_session_expires_at (absolute expiry) when Set-Cookie is not surfaced
 * - rewrites rotated auth cookies back to browser
 */
export async function POST(): Promise<
  NextResponse<ApiResponse<RefreshTokenResponse | null>>
> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;
  const sessionId = cookieStore.get("session_id")?.value;

  if (!refreshToken || !sessionId) {
    return NextResponse.json(
      {
        code: ApiErrorCode.Unknown,
        message: "Missing refresh session",
        data: null,
      },
      { status: 401 },
    );
  }

  try {
    // Use axios directly (not rawPost) to access the raw Set-Cookie headers
    // that carry the Max-Age computed by BE — needed to preserve remember-me TTL.
    const beResponse = await axios.post<ApiResponse<RefreshTokenResponse>>(
      resolvedBaseURL + API_PUBLIC_ROUTES.auth.refresh,
      null,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Refresh-Token": refreshToken,
          "X-Session-Id": sessionId,
        },
        withCredentials: true,
        timeout: DEFAULT_TIMEOUT_MS,
      },
    );

    const rawSetCookie = beResponse.headers["set-cookie"] as
      | string
      | string[]
      | undefined;

    // Forward the exact Max-Age that BE computed for this session.
    // For remember-me: BE sets Max-Age ≈ RememberMeRefreshTTL (30 days, sliding).
    // For non-remember-me: BE sets Max-Age = remaining lifetime (decreasing, max 3 days).
    // Passing it here means FE cookies always match BE session expiry exactly.
    const refreshMaxAge = refreshMaxAgeFromBeSetCookie(rawSetCookie);

    const envelope = beResponse.data;
    const payload = envelope?.data;
    if (payload?.access_token && payload.refresh_token && payload.session_id) {
      await setAuthSessionCookies({
        tokens: payload,
        refreshMaxAge,
      });
    }

    return NextResponse.json(envelope, { status: beResponse.status });
  } catch (error) {
    const axiosError = error as AxiosError<ApiResponse<null>>;
    const statusCode = axiosError.response?.status ?? 500;
    const payload = axiosError.response?.data;
    if (payload) {
      return NextResponse.json(payload, { status: statusCode });
    }
    return NextResponse.json(
      {
        code: ApiErrorCode.Unknown,
        message: "Refresh request failed",
        data: null,
      },
      { status: statusCode },
    );
  }
}
