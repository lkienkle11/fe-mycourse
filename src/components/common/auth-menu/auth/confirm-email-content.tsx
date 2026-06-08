"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { confirmAction } from "@/actions/auth";
import { useGetMe } from "@/hooks";
import { useSendBroadcastOutbound } from "@/hooks/events/broadcast/use-send-broadcast-outbound";
import { useRouter } from "@/i18n/navigation";
import { homeHref } from "@/lib/navigation/routes";
import { translateApiErrorCode } from "@/lib/utils/api-error";

type ConfirmStatus = "loading" | "missing" | "error" | "success";

export function ConfirmEmailContent() {
  const t = useTranslations("auth.confirm");
  const tErrors = useTranslations("errors.codes");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const { mutateMe } = useGetMe();
  const sendBroadcast = useSendBroadcastOutbound();
  const [status, setStatus] = useState<ConfirmStatus>(
    token ? "loading" : "missing",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token || calledRef.current) return;
    calledRef.current = true;

    void (async () => {
      const result = await confirmAction({ token });
      if (result.success) {
        setStatus("success");
        await mutateMe();
        sendBroadcast({
          source: "broadcast",
          type: "confirm_success",
          payload: { messageId: `confirm-${Date.now()}` },
        });
        router.replace(homeHref);
        return;
      }
      setErrorMessage(translateApiErrorCode(tErrors, result.code));
      setStatus("error");
    })();
  }, [token, mutateMe, router, sendBroadcast, tErrors]);

  if (status === "missing") {
    return (
      <p className="text-center text-destructive text-sm h-dvh">
        {t("invalidToken")}
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="text-center text-destructive text-sm h-dvh">
        {errorMessage}
      </p>
    );
  }

  if (status === "success") {
    return (
      <p className="text-center text-sm text-black/80 h-dvh">{t("success")}</p>
    );
  }

  return (
    <p className="text-center text-sm text-black/80 h-dvh">{t("verifying")}</p>
  );
}
