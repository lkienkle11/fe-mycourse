"use client";

import { useEffect, useRef } from "react";
import { googleOneTapAction } from "@/actions/auth/google-oauth";
import { useGetMe } from "@/hooks/auth/use-auth-store";
import type { GoogleIdConfig } from "@/types/auth/google-oauth";

interface UseGoogleOneTapOptions {
  onSuccess?: () => void;
}

export function useGoogleOneTap({ onSuccess }: UseGoogleOneTapOptions = {}) {
  const { me, isLoading } = useGetMe();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (isLoading || me != null || initializedRef.current) {
      return;
    }
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google?.accounts?.id) {
      return;
    }

    initializedRef.current = true;

    const idConfig: GoogleIdConfig = {
      client_id: clientId,
      callback: async (response) => {
        if (!response.credential) return;
        const result = await googleOneTapAction({
          credential: response.credential,
        });
        if (result.success) {
          onSuccess?.();
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      context: "signin",
    };
    window.google.accounts.id.initialize(idConfig);

    window.google.accounts.id.prompt();

    return () => {
      window.google?.accounts?.id?.cancel();
      initializedRef.current = false;
    };
  }, [isLoading, me, onSuccess]);
}
