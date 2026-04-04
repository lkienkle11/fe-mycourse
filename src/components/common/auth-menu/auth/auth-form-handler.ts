"use client";

import { loginAction, signupAction } from "@/actions/auth";
import type { LoginFormValues, SignupFormValues } from "@/schema/auth";

export interface AuthActionResult {
  success: boolean;
  message: string;
  code: number;
}

/**
 * Hàm xử lý submit dùng chung cho cả form đăng nhập và đăng ký.
 *
 * Sử dụng `type` để phân biệt action cần gọi:
 * - "login"  → loginAction
 * - "signup" → signupAction
 *
 * Cả hai component LoginContent và SignupContent đều dùng hàm này
 * thay vì gọi trực tiếp server action, giữ cho component gọn.
 */
export async function handleAuthSubmit(
  type: "login",
  payload: LoginFormValues,
): Promise<AuthActionResult>;
export async function handleAuthSubmit(
  type: "signup",
  payload: SignupFormValues,
): Promise<AuthActionResult>;
export async function handleAuthSubmit(
  type: "login" | "signup",
  payload: LoginFormValues | SignupFormValues,
): Promise<AuthActionResult> {
  if (type === "login") {
    const { email, password, rememberMe } = payload as LoginFormValues;
    return loginAction({ email, password, remember_me: rememberMe ?? false });
  }

  if (type === "signup") {
    const { email, password, fullName } = payload as SignupFormValues;
    return signupAction({ email, password, display_name: fullName });
  }

  throw new Error(`Unknown auth type: ${type}`);
}
