import { randomBytes } from "node:crypto";
import type { cookies } from "next/headers";
import { buildAuthCookieOptions, getCookieDomain } from "@/lib/utils/cookie";

export const OAUTH_FLOW_COOKIE_TTL = 600;

export type OAuthEntrypoint = "login" | "signup";

export function randomOAuthState(): string {
  return randomBytes(16).toString("base64url");
}

export function oauthFlowCookieOptions(maxAge: number) {
  const isProduction = process.env.NODE_ENV === "production";
  return buildAuthCookieOptions({
    sameSite: "lax",
    isProduction,
    maxAge,
    domain: getCookieDomain(process.env.AUTH_COOKIE_DOMAIN),
  });
}

export async function clearOAuthFlowCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  names: readonly string[],
) {
  const opts = oauthFlowCookieOptions(0);
  for (const name of names) {
    cookieStore.set(name, "", { ...opts, maxAge: 0 });
  }
}

export function readOAuthFlowContext(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  names: { entrypoint: string; rememberMe: string },
): { entrypoint: OAuthEntrypoint; rememberMe: boolean } {
  const entrypoint =
    (cookieStore.get(names.entrypoint)?.value as OAuthEntrypoint) ?? "login";
  const rememberMe = cookieStore.get(names.rememberMe)?.value === "1";
  return { entrypoint, rememberMe };
}
