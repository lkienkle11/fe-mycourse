"use client";

import { loginAction, registerAction } from "@/actions/auth";
import type { LoginFormValues, SignupFormValues } from "@/schema/auth";
import type { AuthActionResult } from "@/types/auth/auth";

export type { AuthActionResult };

export async function handleAuthSubmit(
  type: "login",
  payload: LoginFormValues,
): Promise<AuthActionResult>;
export async function handleAuthSubmit(
  type: "signup",
  payload: SignupFormValues,
  locale: string,
): Promise<AuthActionResult>;
export async function handleAuthSubmit(
  type: "login" | "signup",
  payload: LoginFormValues | SignupFormValues,
  locale?: string,
): Promise<AuthActionResult> {
  if (type === "login") {
    const { email, password, rememberMe } = payload as LoginFormValues;
    return loginAction({ email, password, remember_me: rememberMe ?? false });
  }

  const { email, password, fullName } = payload as SignupFormValues;
  return registerAction({
    email,
    password,
    display_name: fullName,
    locale: locale ?? "vi",
  });
}
