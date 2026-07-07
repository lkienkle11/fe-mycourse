"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { toast } from "sonner";
import { useGetMe } from "@/hooks/auth/use-auth-store";
import { useGoogleOneTap } from "@/hooks/auth/use-google-one-tap";

export function GoogleOneTapHost() {
  const t = useTranslations("auth.socialLogin");
  const { mutateMe } = useGetMe();

  const onSuccess = useCallback(() => {
    toast.success(t("googleSuccess"));
    mutateMe();
  }, [mutateMe, t]);

  useGoogleOneTap({ onSuccess });

  return null;
}
