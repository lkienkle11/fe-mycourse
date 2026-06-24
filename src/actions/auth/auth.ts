"use server";

import { cookies } from "next/headers";
import type {
  ConfirmPayload,
  LoginPayload,
  RegisterPayload,
} from "@/api/callers/auth";
import {
  confirmService,
  loginService,
  logoutService,
  registerService,
} from "@/api/callers/auth";
import { ApiErrorCode } from "@/constants/api-error-code";
import {
  clearAuthSessionCookies,
  refreshMaxAgeFromBeSetCookie,
  setAuthSessionCookies,
} from "@/lib/utils/auth-session";

export interface AuthActionResult {
  success: boolean;
  message: string;
  code: number;
  /** Seconds until retry when register is rate-limited (4010). */
  retryAfterSeconds?: number;
}

function parseRetryAfterSeconds(
  headers?: Record<string, string>,
): number | undefined {
  if (!headers) return undefined;
  const raw =
    headers["retry-after"] ??
    headers["Retry-After"] ??
    headers["x-mycourse-register-retry-after"] ??
    headers["X-Mycourse-Register-Retry-After"];
  if (!raw) return undefined;
  const sec = Number.parseInt(raw, 10);
  return Number.isFinite(sec) && sec > 0 ? sec : undefined;
}

function mapAxiosAuthError(error: unknown): AuthActionResult {
  const axiosError = error as {
    response?: {
      data?: { code?: number; message?: string };
      headers?: Record<string, string>;
    };
  };
  const code = axiosError?.response?.data?.code ?? ApiErrorCode.Unknown;
  const message =
    axiosError?.response?.data?.message ?? "Unexpected error occurred";
  const retryAfterSeconds = parseRetryAfterSeconds(
    axiosError?.response?.headers,
  );
  return { success: false, message, code, retryAfterSeconds };
}

/**
 * Server Action đăng nhập.
 */
export async function loginAction(
  payload: LoginPayload,
): Promise<AuthActionResult> {
  try {
    const { data: response, setCookieHeaders } = await loginService(payload);

    if (response.code === ApiErrorCode.Success && response.data) {
      const { access_token, refresh_token, session_id } = response.data;
      await setAuthSessionCookies({
        tokens: { access_token, refresh_token, session_id },
        refreshMaxAge: refreshMaxAgeFromBeSetCookie(setCookieHeaders),
      });
      return { success: true, message: response.message, code: response.code };
    }

    return { success: false, message: response.message, code: response.code };
  } catch (error: unknown) {
    return mapAxiosAuthError(error);
  }
}

/**
 * Server Action đăng ký — 201 không set cookie; user xác nhận qua email.
 */
export async function registerAction(
  payload: RegisterPayload,
): Promise<AuthActionResult> {
  try {
    const { data: response } = await registerService(payload);

    if (response.code === ApiErrorCode.Success) {
      return { success: true, message: response.message, code: response.code };
    }

    return { success: false, message: response.message, code: response.code };
  } catch (error: unknown) {
    return mapAxiosAuthError(error);
  }
}

/** @deprecated Use registerAction */
export const signupAction = registerAction;

/**
 * Server Action xác nhận email — set cookie giống login và trả tokens.
 */
export async function confirmAction(
  payload: ConfirmPayload,
): Promise<AuthActionResult> {
  try {
    const { data: response, setCookieHeaders } = await confirmService(payload);

    if (response.code === ApiErrorCode.Success && response.data) {
      const { access_token, refresh_token, session_id } = response.data;
      await setAuthSessionCookies({
        tokens: { access_token, refresh_token, session_id },
        refreshMaxAge: refreshMaxAgeFromBeSetCookie(setCookieHeaders),
      });
      return { success: true, message: response.message, code: response.code };
    }

    return { success: false, message: response.message, code: response.code };
  } catch (error: unknown) {
    return mapAxiosAuthError(error);
  }
}

/**
 * Server Action đăng xuất — revoke session BE và xóa cookie phía server.
 */
export async function logoutAction(): Promise<AuthActionResult> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;
  const sessionId = cookieStore.get("session_id")?.value;

  try {
    if (refreshToken && sessionId) {
      await logoutService(refreshToken, sessionId);
    }
    await clearAuthSessionCookies();
    return {
      success: true,
      message: "logout_success",
      code: ApiErrorCode.Success,
    };
  } catch (error: unknown) {
    await clearAuthSessionCookies();
    return mapAxiosAuthError(error);
  }
}
