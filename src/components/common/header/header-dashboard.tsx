"use client";

import { MainLogo } from "@public/assets/icons";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { AuthLayout } from "@/components/common/auth-menu/auth-layout";
import { useRouter } from "@/i18n/navigation";
import { navigateToHome } from "@/lib/navigation/home";

export type HeaderDashboardProps = {
  /** Inside `SidebarProvider` — e.g. `<SidebarTrigger className="md:hidden" />`. */
  leading?: ReactNode;
  /** Right of logo, before auth — e.g. `LocaleSwitcher` from `dashboard-layout`. */
  trailing?: ReactNode;
};

/** Dashboard shell header — logo block + auth chrome. */
export function HeaderDashboard({ leading, trailing }: HeaderDashboardProps) {
  const t = useTranslations("home");
  const router = useRouter();
  const handleNavigateHome = () => navigateToHome(router);

  return (
    <header className="relative md:sticky top-0 z-20 flex h-16 w-full shrink-0 items-center justify-between border-b border-border bg-background px-4 max-md:px-2">
      <div className="flex min-w-0 items-center gap-2">
        {leading}
        <button
          type="button"
          className="hidden cursor-pointer select-none items-center justify-center gap-1.5 border-0 bg-transparent p-0 md:flex"
          onClick={handleNavigateHome}
        >
          <MainLogo />
          <h1 className="bg-black bg-clip-text text-xl font-bold text-transparent">
            {t("header.title")}
          </h1>
        </button>
      </div>
      <div className="flex items-center justify-center gap-4">
        {trailing}
        <AuthLayout />
      </div>
    </header>
  );
}
