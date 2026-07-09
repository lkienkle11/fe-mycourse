"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiErrorCode } from "@/constants/api-error-code";
import type { AuthActionResult } from "@/types/auth/auth";

export interface OAuthPopupStartResult {
  success: boolean;
  authorizeUrl?: string;
  code?: number;
  message?: string;
}

interface OAuthPopupCallbackMessage {
  type: string;
  code?: string;
  state?: string;
  error?: string;
}

interface UseOAuthPopupLoginOptions {
  entrypoint: "login" | "signup";
  rememberMe: boolean;
  messageType: string;
  popupName: string;
  startFailedCode: number;
  startAction: (payload: {
    entrypoint: "login" | "signup";
    remember_me: boolean;
  }) => Promise<OAuthPopupStartResult>;
  completeAction: (payload: {
    code: string;
    state: string;
  }) => Promise<AuthActionResult>;
  onSuccess?: (result: AuthActionResult) => void;
  onCancel?: () => void;
  onError?: (result: AuthActionResult) => void;
}

export function useOAuthPopupLogin({
  entrypoint,
  rememberMe,
  messageType,
  popupName,
  startFailedCode,
  startAction,
  completeAction,
  onSuccess,
  onCancel,
  onError,
}: UseOAuthPopupLoginOptions) {
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

  const startLogin = useCallback(async () => {
    setIsPending(true);
    try {
      const start = await startAction({
        entrypoint,
        remember_me: rememberMe,
      });
      if (!start.success || !start.authorizeUrl) {
        onError?.({
          success: false,
          message: start.message ?? "oauth_start_failed",
          code: start.code ?? startFailedCode,
        });
        return;
      }

      const popup = window.open(
        start.authorizeUrl,
        popupName,
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
  }, [
    clearPopupWatch,
    entrypoint,
    onCancel,
    onError,
    popupName,
    rememberMe,
    startAction,
    startFailedCode,
  ]);

  useEffect(() => {
    const onMessage = async (
      event: MessageEvent<OAuthPopupCallbackMessage>,
    ) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== messageType) return;

      clearPopupWatch(true);

      if (event.data.error || !event.data.code || !event.data.state) {
        setIsPending(false);
        onCancel?.();
        return;
      }

      try {
        const result = await completeAction({
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
  }, [
    clearPopupWatch,
    completeAction,
    messageType,
    onCancel,
    onError,
    onSuccess,
  ]);

  return { startLogin, isPending };
}
