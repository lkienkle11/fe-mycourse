"use server";

import { cookies } from "next/headers";
import { loginService } from "@/api/callers/auth";
import type { LoginPayload, SignupPayload } from "@/api/callers/auth";
import { buildCookieOptions, getCookieDomain } from "@/lib/utils";
import { ApiErrorCode } from "@/types/api";

export interface AuthActionResult {
  success: boolean;
  message: string;
  code: number;
}

/** MaxAge (seconds) cho refresh_token / session_id khi remember_me = true (30 ngày). */
const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60;

/**
 * Server Action đăng nhập.
 *
 * Client gọi action này thay vì gọi trực tiếp service để tránh lộ
 * endpoint /api/v1/auth/login ra network tab của browser.
 *
 * Vì request đi qua Next.js server, Set-Cookie từ BE không tự forward tới
 * browser. Action tự set lại ba HttpOnly cookies khớp với tên BE đọc vào:
 *   - access_token  — lấy từ JSON body
 *   - refresh_token — lấy từ JSON body
 *   - session_id    — lấy từ Set-Cookie header của BE response
 */
export async function loginAction(
  payload: LoginPayload,
): Promise<AuthActionResult> {
  try {
    const { data: response } = await loginService(payload);

    if (response.code === ApiErrorCode.Success && response.data) {
      const { access_token, refresh_token, session_id } = response.data;
      const refreshMaxAge = payload.remember_me
        ? REMEMBER_ME_MAX_AGE
        : undefined;
      const isProduction = process.env.NODE_ENV === "production";
      const domain = getCookieDomain(process.env.AUTH_COOKIE_DOMAIN);
      const sameSite = "lax";

      const cookieStore = await cookies();

      // Cookies are non-HttpOnly so that client-side JS can read them and attach
      // them as Authorization / X-Refresh-Token / X-Session-Id headers.
      cookieStore.set(
        "access_token",
        access_token,
        buildCookieOptions({ sameSite, isProduction, domain }),
      );

      cookieStore.set(
        "refresh_token",
        refresh_token,
        buildCookieOptions({
          sameSite,
          isProduction,
          domain,
          maxAge: refreshMaxAge,
        }),
      );

      if (session_id) {
        cookieStore.set(
          "session_id",
          session_id,
          buildCookieOptions({
            sameSite,
            isProduction,
            domain,
            maxAge: refreshMaxAge,
          }),
        );
      }

      return { success: true, message: response.message, code: response.code };
    }

    return { success: false, message: response.message, code: response.code };
  } catch (error: unknown) {
    const axiosError = error as {
      response?: { data?: { code?: number; message?: string } };
    };
    const code = axiosError?.response?.data?.code ?? ApiErrorCode.Unknown;
    const message =
      axiosError?.response?.data?.message ?? "Unexpected error occurred";
    return { success: false, message, code };
  }
}

/**
 * Server Action đăng ký tài khoản.
 * Placeholder — sẽ gọi signupService khi triển khai đầy đủ.
 */
export async function signupAction(
  payload: SignupPayload,
): Promise<AuthActionResult> {
  void payload;
  // TODO: implement signupService và gọi tại đây
  return {
    success: false,
    message: "Signup not implemented yet",
    code: ApiErrorCode.Unknown,
  };
}
