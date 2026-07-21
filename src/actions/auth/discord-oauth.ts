"use server";

import { cookies } from "next/headers";
import { createWritableServerApiMethods } from "@/api/auth/server-auth";
import { createAuthCallers } from "@/api/callers/auth/auth-factory";
import { ApiErrorCode } from "@/constants/api-error-code";
import { finalizeAuthLoginAction } from "@/lib/utils/auth-action";
import {
  clearOAuthFlowCookies,
  OAUTH_FLOW_COOKIE_TTL,
  oauthFlowCookieOptions,
  randomOAuthState,
  readOAuthFlowContext,
} from "@/lib/utils/oauth-popup-cookies";
import type { AuthActionResult } from "@/types/auth/auth";

const DISCORD_OAUTH_STATE = "discord_oauth_state";
const DISCORD_OAUTH_ENTRYPOINT = "discord_oauth_entrypoint";
const DISCORD_OAUTH_REMEMBER_ME = "discord_oauth_remember_me";
const DISCORD_OAUTH_COOKIE_NAMES = [
  DISCORD_OAUTH_STATE,
  DISCORD_OAUTH_ENTRYPOINT,
  DISCORD_OAUTH_REMEMBER_ME,
] as const;
const DISCORD_AUTHORIZE_URL = "https://discord.com/oauth2/authorize";
const DISCORD_OAUTH_SCOPE = "identify email";

export interface StartDiscordLoginResult {
  success: boolean;
  authorizeUrl?: string;
  code?: number;
  message?: string;
}

function resolveDiscordCallbackUrl(): string | null {
  const callbackUrl = process.env.NEXT_PUBLIC_DISCORD_CALLBACK_URL?.trim();
  return callbackUrl || null;
}

export async function startDiscordLoginAction(payload: {
  entrypoint: "login" | "signup";
  remember_me: boolean;
}): Promise<StartDiscordLoginResult> {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  if (!clientId) {
    return {
      success: false,
      code: ApiErrorCode.DiscordOAuthStartFailed,
      message: "Discord OAuth is not configured",
    };
  }

  const redirectUri = resolveDiscordCallbackUrl();
  if (!redirectUri) {
    return {
      success: false,
      code: ApiErrorCode.DiscordOAuthStartFailed,
      message: "Discord callback URL is not configured",
    };
  }

  const state = randomOAuthState();
  const cookieStore = await cookies();
  const opts = oauthFlowCookieOptions(OAUTH_FLOW_COOKIE_TTL);

  cookieStore.set(DISCORD_OAUTH_STATE, state, opts);
  cookieStore.set(DISCORD_OAUTH_ENTRYPOINT, payload.entrypoint, opts);
  cookieStore.set(
    DISCORD_OAUTH_REMEMBER_ME,
    payload.remember_me ? "1" : "0",
    opts,
  );

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: DISCORD_OAUTH_SCOPE,
    state,
  });

  return {
    success: true,
    authorizeUrl: `${DISCORD_AUTHORIZE_URL}?${params.toString()}`,
  };
}

export async function discordLoginAction(payload: {
  code: string;
  state: string;
}): Promise<AuthActionResult> {
  const cookieStore = await cookies();
  const storedState = cookieStore.get(DISCORD_OAUTH_STATE)?.value;
  const { entrypoint, rememberMe: rememberRaw } = readOAuthFlowContext(
    cookieStore,
    {
      entrypoint: DISCORD_OAUTH_ENTRYPOINT,
      rememberMe: DISCORD_OAUTH_REMEMBER_ME,
    },
  );

  if (!storedState || storedState !== payload.state) {
    await clearOAuthFlowCookies(cookieStore, DISCORD_OAUTH_COOKIE_NAMES);
    return {
      success: false,
      message: "invalid_oauth_state",
      code: ApiErrorCode.InvalidOAuthState,
    };
  }

  try {
    const auth = createAuthCallers(await createWritableServerApiMethods());
    return await finalizeAuthLoginAction(() =>
      auth.discordLoginService({
        code: payload.code,
        remember_me: entrypoint === "login" ? rememberRaw : false,
        entrypoint,
      }),
    );
  } finally {
    await clearOAuthFlowCookies(cookieStore, DISCORD_OAUTH_COOKIE_NAMES);
  }
}
