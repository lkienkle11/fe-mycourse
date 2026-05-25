"use client";

import { useTranslations } from "next-intl";

/** Shown when layout-level dashboard permissions are not satisfied. */
export function DashboardUnauthorized() {
  const t = useTranslations("dashboard");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-2 py-16 text-center">
      <h2 className="text-lg font-semibold">{t("unauthorized.title")}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {t("unauthorized.description")}
      </p>
    </div>
  );
}
