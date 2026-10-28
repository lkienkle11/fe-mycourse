"use client";

import { useTranslations } from "next-intl";
import { StatusErrorPage } from "@/components/shared/status-error-page";
import type { MeOutage } from "@/hooks/auth/use-me-outage";

/** Full-page state for a `/me` outage: `StatusErrorPage` plus a retry that revalidates `/me`. */
export function MeOutagePage({
  outage,
  fillViewport,
}: {
  outage: MeOutage;
  fillViewport?: boolean;
}) {
  const t = useTranslations("errors.boundary");

  return (
    <StatusErrorPage
      variant={outage.variant}
      action={{ label: t("retry"), onClick: () => outage.retry() }}
      fillViewport={fillViewport}
    />
  );
}
