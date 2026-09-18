"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { StatusErrorPage } from "@/components/shared/status-error-page";

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** Catches a render-time error from any component under `[locale]`. */
export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const t = useTranslations("errors.boundary");

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <StatusErrorPage
      variant="server-error"
      title={t("title")}
      description={t("description")}
      action={{ label: t("retry"), onClick: reset }}
    />
  );
}
