"use server";

import { createHash, randomBytes } from "node:crypto";
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

const X_OAUTH_STATE = "x_oauth_state";
const X_OAUTH_VERIFIER = "x_oauth_verifier";
const X_OAUTH_ENTRYPOINT = "x_oauth_entrypoint";
const X_OAUTH_REMEMBER_ME = "x_oauth_remember_me";
const X_OAUTH_COOKIE_NAMES = [
  X_OAUTH_STATE,
  X_OAUTH_VERIFIER,
  X_OAUTH_ENTRYPOINT,
  X_OAUTH_REMEMBER_ME,
] as const;
const X_AUTHORIZE_URL = "https://twitter.com/i/oauth2/authorize";
const X_OAUTH_SCOPE = "users.read users.email";

export interface StartXLoginResult {
  success: boolean;
  authorizeUrl?: string;
  code?: number;
  message?: string;
}

function pkceVerifier(): string {
  return randomBytes(32).toString("base64url");
}

function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

function resolveXCallbackUrl(): string | null {
  const callbackUrl = process.env.NEXT_PUBLIC_X_CALLBACK_URL?.trim();
  return callbackUrl || null;
}

export async function startXLoginAction(payload: {
  entrypoint: "login" | "signup";
  remember_me: boolean;
}): Promise<StartXLoginResult> {
  const clientId = process.env.NEXT_PUBLIC_X_CLIENT_ID;
  if (!clientId) {
    return {
      success: false,
      code: ApiErrorCode.XOAuthStartFailed,
      message: "X OAuth is not configured",
    };
  }

  const redirectUri = resolveXCallbackUrl();
  if (!redirectUri) {
    return {
      success: false,
      code: ApiErrorCode.XOAuthStartFailed,
      message: "X callback URL is not configured",
    };
  }

  const state = randomOAuthState();
  const verifier = pkceVerifier();
  const challenge = pkceChallenge(verifier);
  const cookieStore = await cookies();
  const opts = oauthFlowCookieOptions(OAUTH_FLOW_COOKIE_TTL);

  cookieStore.set(X_OAUTH_STATE, state, opts);
  cookieStore.set(X_OAUTH_VERIFIER, verifier, opts);
  cookieStore.set(X_OAUTH_ENTRYPOINT, payload.entrypoint, opts);
  cookieStore.set(X_OAUTH_REMEMBER_ME, payload.remember_me ? "1" : "0", opts);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: X_OAUTH_SCOPE,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  return {
    success: true,
    authorizeUrl: `${X_AUTHORIZE_URL}?${params.toString()}`,
  };
}

export async function xLoginAction(payload: {
  code: string;
  state: string;
}): Promise<AuthActionResult> {
  const cookieStore = await cookies();
  const storedState = cookieStore.get(X_OAUTH_STATE)?.value;
  const verifier = cookieStore.get(X_OAUTH_VERIFIER)?.value;
  const { entrypoint, rememberMe: rememberRaw } = readOAuthFlowContext(
    cookieStore,
    { entrypoint: X_OAUTH_ENTRYPOINT, rememberMe: X_OAUTH_REMEMBER_ME },
  );

  if (!storedState || !verifier || storedState !== payload.state) {
    await clearOAuthFlowCookies(cookieStore, X_OAUTH_COOKIE_NAMES);
    return {
      success: false,
      message: "invalid_oauth_state",
      code: ApiErrorCode.InvalidOAuthState,
    };
  }

  try {
    const auth = createAuthCallers(await createWritableServerApiMethods());
    return await finalizeAuthLoginAction(() =>
      auth.xLoginService({
        code: payload.code,
        code_verifier: verifier,
        remember_me: entrypoint === "login" ? rememberRaw : false,
        entrypoint,
      }),
    );
  } finally {
    await clearOAuthFlowCookies(cookieStore, X_OAUTH_COOKIE_NAMES);
  }
}
