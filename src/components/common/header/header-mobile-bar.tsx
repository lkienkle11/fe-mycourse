"use client";

import { BrandLogoLink } from "@/components/common/header/brand-logo-link";
import { HeaderMobileSidebar } from "@/components/common/header/header-mobile-sidebar";

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
      <BrandLogoLink />

      <HeaderMobileSidebar
        title={title}
        searchPlaceholder={searchPlaceholder}
      />
    </div>
  );
}
