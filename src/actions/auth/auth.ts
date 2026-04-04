"use server";

import { cookies } from "next/headers";
import { loginService } from "@/api/callers/auth";
import type { LoginPayload, SignupPayload } from "@/api/callers/auth";
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
    const { data: response, cookies: responseCookies } = await loginService(payload);

    if (response.code === ApiErrorCode.Success && response.data) {
      const { access_token, refresh_token } = response.data;
      const session_id = responseCookies.session_id;
      const isProduction = process.env.NODE_ENV === "production";
      const refreshMaxAge = payload.remember_me ? REMEMBER_ME_MAX_AGE : undefined;

      const cookieStore = await cookies();

      cookieStore.set("access_token", access_token, {
        httpOnly: true,
        sameSite: "strict",
        secure: isProduction,
        path: "/",
      });

      cookieStore.set("refresh_token", refresh_token, {
        httpOnly: true,
        sameSite: "strict",
        secure: isProduction,
        path: "/",
        maxAge: refreshMaxAge,
      });

      if (session_id) {
        cookieStore.set("session_id", session_id, {
          httpOnly: true,
          sameSite: "strict",
          secure: isProduction,
          path: "/",
          maxAge: refreshMaxAge,
        });
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
  _payload: SignupPayload,
): Promise<AuthActionResult> {
  // TODO: implement signupService và gọi tại đây
  return {
    success: false,
    message: "Signup not implemented yet",
    code: ApiErrorCode.Unknown,
  };
}
