"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/actions/auth";
import { useGetMe } from "@/hooks";
import { useSendBroadcastOutbound } from "@/hooks/events/broadcast/use-send-broadcast-outbound";
import { useRouter } from "@/i18n/navigation";
import { homeHref } from "@/lib/navigation/routes";
import { translateApiErrorCode } from "@/lib/utils/api-error";

type LogoutStatus = "loading" | "error" | "success";

export function LogoutContent() {
  const t = useTranslations("auth.logout");
  const tErrors = useTranslations("errors.codes");
  const router = useRouter();
  const { mutateMe } = useGetMe();
  const sendBroadcast = useSendBroadcastOutbound();
  const [status, setStatus] = useState<LogoutStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    void (async () => {
      const result = await logoutAction();
      if (result.success) {
        setStatus("success");
        await mutateMe();
        sendBroadcast({
          source: "broadcast",
          type: "logout",
          payload: { reason: "user" },
        });
        router.replace(homeHref);
        return;
      }
      setErrorMessage(translateApiErrorCode(tErrors, result.code));
      setStatus("error");
    })();
  }, [mutateMe, router, sendBroadcast, tErrors]);

  if (status === "error") {
    return (
      <p className="text-center text-destructive text-sm h-dvh">
        {errorMessage ?? t("error")}
      </p>
    );
  }

  if (status === "success") {
    return (
      <p className="text-center text-sm text-black/80 h-dvh">{t("success")}</p>
    );
  }

  return (
    <p className="text-center text-sm text-black/80 h-dvh">{t("loggingOut")}</p>
  );
}
