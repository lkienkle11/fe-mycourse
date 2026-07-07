"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthActionResult } from "@/actions/auth";
import { googleLoginAction } from "@/actions/auth/google-oauth";
import { ApiErrorCode } from "@/constants/api-error-code";
import type {
  GoogleCodeClient,
  GoogleCodeClientConfig,
} from "@/types/auth/google-oauth";

interface UseGoogleLoginOptions {
  rememberMe: boolean;
  onSuccess?: (result: AuthActionResult) => void;
  onCancel?: () => void;
  onError?: (result: AuthActionResult) => void;
}

export function useGoogleLogin({
  rememberMe,
  onSuccess,
  onCancel,
  onError,
}: UseGoogleLoginOptions) {
  const [isPending, setIsPending] = useState(false);
  const clientRef = useRef<GoogleCodeClient | null>(null);
  const rememberMeRef = useRef(rememberMe);
  const onSuccessRef = useRef(onSuccess);
  const onCancelRef = useRef(onCancel);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    rememberMeRef.current = rememberMe;
  }, [rememberMe]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onCancelRef.current = onCancel;
    onErrorRef.current = onError;
  }, [onCancel, onError, onSuccess]);

  const startGoogleLogin = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google?.accounts?.oauth2) {
      onErrorRef.current?.({
        success: false,
        message: "google_not_configured",
        code: ApiErrorCode.GoogleOAuthNotConfigured,
      });
      return;
    }

    setIsPending(true);

    if (!clientRef.current) {
      const config: GoogleCodeClientConfig = {
        client_id: clientId,
        scope: "openid email profile",
        ux_mode: "popup",
        callback: async (response) => {
          try {
            if (!response.code) {
              onCancelRef.current?.();
              return;
            }
            const result = await googleLoginAction({
              code: response.code,
              remember_me: rememberMeRef.current,
            });
            if (result.success) {
              onSuccessRef.current?.(result);
            } else {
              onErrorRef.current?.(result);
            }
          } finally {
            setIsPending(false);
          }
        },
        error_callback: () => {
          setIsPending(false);
          onCancelRef.current?.();
        },
      };
      clientRef.current = window.google.accounts.oauth2.initCodeClient(config);
    }

    clientRef.current.requestCode();
  }, []);

  return { startGoogleLogin, isPending };
}
