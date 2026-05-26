"use client";

import { MainLogo } from "@public/assets/icons";

import { HeaderMobileSidebar } from "@/components/common/header/header-mobile-sidebar";
import { Link } from "@/i18n/navigation";
import { homeHref } from "@/lib/navigation/home";

export interface HeaderMobileBarProps {
  title: string;
  searchPlaceholder: string;
}

/**
 * Compact header row below lg: logo icon + burger opening the unified sidebar.
 */
export function HeaderMobileBar({
  title,
  searchPlaceholder,
}: HeaderMobileBarProps) {
  return (
    <div className="container container-wrap mx-auto flex w-full items-center justify-between px-2.5 py-4 lg:hidden xl:px-4">
      <Link href={homeHref} className="flex items-center select-none">
        <MainLogo />
      </Link>

      <HeaderMobileSidebar
        title={title}
        searchPlaceholder={searchPlaceholder}
      />
    </div>
  );
}
