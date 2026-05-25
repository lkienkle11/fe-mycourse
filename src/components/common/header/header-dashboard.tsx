"use client";

import { MainLogo } from "@public/assets/icons";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { AuthLayout } from "@/components/common/auth-menu/auth-layout";

export type HeaderDashboardProps = {
  /** Inside `SidebarProvider` — e.g. `<SidebarTrigger className="md:hidden" />`. */
  leading?: ReactNode;
  /** Right of logo, before auth — e.g. `LocaleSwitcher` from `dashboard-layout`. */
  trailing?: ReactNode;
};

/** Dashboard shell header — logo block + auth chrome. */
export function HeaderDashboard({ leading, trailing }: HeaderDashboardProps) {
  const t = useTranslations("home");

  return (
    <header className="relative z-20 flex h-16 w-full shrink-0 items-center justify-between border-b border-border bg-background px-4 max-md:px-2">
      <div className="flex min-w-0 items-center gap-2">
        {leading}
        <div className="hidden cursor-pointer select-none items-center justify-center gap-1.5 md:flex">
          <MainLogo />
          <h1 className="bg-black bg-clip-text text-xl font-bold text-transparent">
            {t("header.title")}
          </h1>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4">
        {trailing}
        <AuthLayout />
      </div>
    </header>
  );
}
