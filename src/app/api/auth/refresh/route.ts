import axios, { type AxiosError } from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ApiErrorCode } from "@/constants/api-error-code";
import { API_PUBLIC_ROUTES } from "@/constants/api-route";
import { setAuthSessionCookies } from "@/lib/utils/auth-session";
import type { ApiResponse } from "@/types/api";
import type { RefreshTokenResponse } from "@/types/auth";

const DEFAULT_BASE_URL = "http://localhost:3000/api";
const DEFAULT_TIMEOUT_MS = 10_000;
const resolvedBaseURL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? DEFAULT_BASE_URL;

/**
 * Parse the Max-Age directive (in seconds) for a specific cookie name from
 * the Set-Cookie response header(s).  Returns undefined when the named cookie
 * is not found or carries no Max-Age (i.e. it is a session-scoped cookie).
 */
function parseMaxAgeForCookie(
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

    const match = /[Mm]ax-[Aa]ge=(\d+)/.exec(entry);
    return match ? parseInt(match[1], 10) : undefined;
  }
  return undefined;
}

/**
 * Browser-safe refresh proxy:
 * - reads HttpOnly refresh/session cookies on Next server
 * - sends explicit refresh headers to BE (avoids duplicate-cookie ambiguity)
 * - reads the Max-Age from BE's Set-Cookie to preserve remember-me status
 * - rewrites rotated auth cookies back to browser with the correct TTL
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
    // For remember-me: BE sets Max-Age ≈ RememberMeRefreshTTL (14 days, sliding).
    // For non-remember-me: BE sets Max-Age = remaining lifetime (decreasing).
    // Passing it here means FE cookies always match BE session expiry exactly.
    const refreshMaxAge = parseMaxAgeForCookie(rawSetCookie, "refresh_token");

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
