"use server";

import {
  type AuthSessionTokens,
  setAuthSessionCookies,
} from "@/lib/utils/auth-session";

export interface SyncAuthSessionCookiesInput extends AuthSessionTokens {
  /** Parsed from BE Set-Cookie when available. */
  refreshMaxAge?: number;
}

/**
 * Ghi lại auth cookies HttpOnly sau refresh token (SSR interceptor).
 * Remember-me TTL is restored from BE Set-Cookie Max-Age or auth_session_expires_at cookie.
 */
export async function syncAuthSessionCookiesAction(
  tokens: SyncAuthSessionCookiesInput,
): Promise<void> {
  const { refreshMaxAge, ...sessionTokens } = tokens;
  await setAuthSessionCookies({
    tokens: sessionTokens,
    refreshMaxAge,
  });
}
