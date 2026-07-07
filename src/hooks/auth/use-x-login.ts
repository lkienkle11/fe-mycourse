"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthActionResult } from "@/actions/auth";
import { startXLoginAction, xLoginAction } from "@/actions/auth/x-oauth";
import { ApiErrorCode } from "@/constants/api-error-code";

const X_OAUTH_MESSAGE_TYPE = "x-oauth-callback";

interface XOAuthCallbackMessage {
  type: typeof X_OAUTH_MESSAGE_TYPE;
  code?: string;
  state?: string;
  error?: string;
}

interface UseXLoginOptions {
  entrypoint: "login" | "signup";
  rememberMe: boolean;
  onSuccess?: (result: AuthActionResult) => void;
  onCancel?: () => void;
  onError?: (result: AuthActionResult) => void;
}

export function useXLogin({
  entrypoint,
  rememberMe,
  onSuccess,
  onCancel,
  onError,
}: UseXLoginOptions) {
  const [isPending, setIsPending] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<number | null>(null);

  const clearPopupWatch = useCallback((closePopup = false) => {
    if (pollRef.current != null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (closePopup && popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;
  }, []);

  useEffect(() => {
    return () => clearPopupWatch(false);
  }, [clearPopupWatch]);

  const startXLogin = useCallback(async () => {
    setIsPending(true);
    try {
      const start = await startXLoginAction({
        entrypoint,
        remember_me: rememberMe,
      });
      if (!start.success || !start.authorizeUrl) {
        onError?.({
          success: false,
          message: start.message ?? "x_start_failed",
          code: start.code ?? ApiErrorCode.XOAuthStartFailed,
        });
        return;
      }

      const popup = window.open(
        start.authorizeUrl,
        "x-oauth",
        "width=600,height=700",
      );
      if (!popup) {
        onError?.({
          success: false,
          message: "popup_blocked",
          code: ApiErrorCode.OAuthPopupBlocked,
        });
        return;
      }
      popupRef.current = popup;

      pollRef.current = window.setInterval(() => {
        if (popupRef.current?.closed) {
          clearPopupWatch(false);
          setIsPending(false);
          onCancel?.();
        }
      }, 500);
    } finally {
      if (!popupRef.current) {
        setIsPending(false);
      }
    }
  }, [clearPopupWatch, entrypoint, onCancel, onError, rememberMe]);

  useEffect(() => {
    const onMessage = async (event: MessageEvent<XOAuthCallbackMessage>) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== X_OAUTH_MESSAGE_TYPE) return;

      clearPopupWatch(true);

      if (event.data.error || !event.data.code || !event.data.state) {
        setIsPending(false);
        onCancel?.();
        return;
      }

      try {
        const result = await xLoginAction({
          code: event.data.code,
          state: event.data.state,
        });
        if (result.success) {
          onSuccess?.(result);
        } else {
          onError?.(result);
        }
      } finally {
        setIsPending(false);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [clearPopupWatch, onCancel, onError, onSuccess]);

  return { startXLogin, isPending };
}

export { X_OAUTH_MESSAGE_TYPE };
