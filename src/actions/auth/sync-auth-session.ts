"use server";

import {
  type AuthSessionTokens,
  setAuthSessionCookies,
} from "@/lib/utils/auth-session";

/**
 * Ghi lại auth cookies HttpOnly sau refresh token (client hoặc server interceptor).
 */
export async function syncAuthSessionCookiesAction(
  tokens: AuthSessionTokens,
): Promise<void> {
  await setAuthSessionCookies({ tokens, rememberMe: false });
}
