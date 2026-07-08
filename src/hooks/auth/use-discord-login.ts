"use client";

import {
  discordLoginAction,
  startDiscordLoginAction,
} from "@/actions/auth/discord-oauth";
import { ApiErrorCode } from "@/constants/api-error-code";
import type { AuthActionResult } from "@/types/auth/auth";
import { useOAuthPopupLogin } from "./use-oauth-popup-login";

export const DISCORD_OAUTH_MESSAGE_TYPE = "discord-oauth-callback";

interface UseDiscordLoginOptions {
  entrypoint: "login" | "signup";
  rememberMe: boolean;
  onSuccess?: (result: AuthActionResult) => void;
  onCancel?: () => void;
  onError?: (result: AuthActionResult) => void;
}

export function useDiscordLogin({
  entrypoint,
  rememberMe,
  onSuccess,
  onCancel,
  onError,
}: UseDiscordLoginOptions) {
  const { startLogin, isPending } = useOAuthPopupLogin({
    entrypoint,
    rememberMe,
    messageType: DISCORD_OAUTH_MESSAGE_TYPE,
    popupName: "discord-oauth",
    startFailedCode: ApiErrorCode.DiscordOAuthStartFailed,
    startAction: startDiscordLoginAction,
    completeAction: discordLoginAction,
    onSuccess,
    onCancel,
    onError,
  });

  return { startDiscordLogin: startLogin, isPending };
}
