import "server-only";

import { cookies } from "next/headers";
import { buildCookieOptions, getCookieDomain } from "./cookie";

/** MaxAge (seconds) cho refresh_token / session_id khi remember_me = true (30 ngày). */
export const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60;

export interface AuthSessionTokens {
  access_token: string;
  refresh_token: string;
  session_id?: string;
}

export interface SetAuthSessionCookiesInput {
  tokens: AuthSessionTokens;
  rememberMe?: boolean;
}

/**
 * Ghi access_token, refresh_token, session_id vào cookie — dùng chung cho login và confirm.
 */
export async function setAuthSessionCookies({
  tokens,
  rememberMe = false,
}: SetAuthSessionCookiesInput): Promise<void> {
  const { access_token, refresh_token, session_id } = tokens;
  const refreshMaxAge = rememberMe ? REMEMBER_ME_MAX_AGE : undefined;
  const isProduction = process.env.NODE_ENV === "production";
  const domain = getCookieDomain(process.env.AUTH_COOKIE_DOMAIN);
  const sameSite = "lax" as const;

  const cookieStore = await cookies();

  const set = (name: string, value: string, maxAge?: number) => {
    cookieStore.set(
      name,
      value,
      buildCookieOptions({
        sameSite,
        isProduction,
        domain,
        ...(maxAge !== undefined ? { maxAge } : {}),
      }),
    );
  };

  set("access_token", access_token);
  set("refresh_token", refresh_token, refreshMaxAge);
  if (session_id) {
    set("session_id", session_id, refreshMaxAge);
  }
}

/**
 * Xóa access_token, refresh_token, session_id — dùng chung cho logout.
 */
export async function clearAuthSessionCookies(): Promise<void> {
  const isProduction = process.env.NODE_ENV === "production";
  const domain = getCookieDomain(process.env.AUTH_COOKIE_DOMAIN);
  const sameSite = "lax" as const;
  const cookieStore = await cookies();

  const remove = (name: string) => {
    const opts = buildCookieOptions({
      sameSite,
      isProduction,
      domain,
    });
    cookieStore.delete({
      name,
      path: opts.path,
      ...(opts.domain ? { domain: opts.domain } : {}),
    });
  };

  remove("access_token");
  remove("refresh_token");
  remove("session_id");
}
