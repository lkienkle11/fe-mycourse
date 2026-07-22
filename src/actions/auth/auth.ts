"use server";

import { cookies } from "next/headers";
import { createWritableServerApiMethods } from "@/api/auth/server-auth";
import type {
  ConfirmPayload,
  LoginPayload,
  RegisterPayload,
} from "@/api/callers/auth/auth-factory";
import { createAuthCallers } from "@/api/callers/auth/auth-factory";
import { ApiErrorCode } from "@/constants/api-error-code";
import {
  finalizeAuthLoginAction,
  mapAuthApiError,
} from "@/lib/utils/auth-action";
import { clearAuthSessionCookies } from "@/lib/utils/auth-session";
import type { AuthActionResult } from "@/types/auth/auth";

async function authCallers() {
  return createAuthCallers(await createWritableServerApiMethods());
}

/**
 * Server Action đăng nhập.
 */
export async function loginAction(
  payload: LoginPayload,
): Promise<AuthActionResult> {
  const auth = await authCallers();
  return finalizeAuthLoginAction(() => auth.loginService(payload));
}

/**
 * Server Action đăng ký — 201 không set cookie; user xác nhận qua email.
 */
export async function registerAction(
  payload: RegisterPayload,
): Promise<AuthActionResult> {
  try {
    const auth = await authCallers();
    const { data: response } = await auth.registerService(payload);

    if (response.code === ApiErrorCode.Success) {
      return { success: true, message: response.message, code: response.code };
    }

    return { success: false, message: response.message, code: response.code };
  } catch (error: unknown) {
    return mapAuthApiError(error, { includeRetryAfter: true });
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
  const auth = await authCallers();
  return finalizeAuthLoginAction(() => auth.confirmService(payload));
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
      const auth = await authCallers();
      await auth.logoutService(refreshToken, sessionId);
    }
    await clearAuthSessionCookies();
    return {
      success: true,
      message: "logout_success",
      code: ApiErrorCode.Success,
    };
  } catch (error: unknown) {
    await clearAuthSessionCookies();
    return mapAuthApiError(error);
  }
}
