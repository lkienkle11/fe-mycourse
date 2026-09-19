"use client";

import { MainLogo } from "@public/assets/icons";

import { Link } from "@/i18n/navigation";
import { homeHref } from "@/lib/navigation/home";
import { cn } from "@/lib/utils";

export interface BrandLogoLinkProps {
  className?: string;
}

/** Logo-only link to home, no title text. Shared by header rows that need just the brand mark. */
export function BrandLogoLink({ className }: BrandLogoLinkProps) {
  return (
    <Link
      href={homeHref}
      className={cn("flex items-center select-none", className)}
    >
      <MainLogo />
    </Link>
  );
}
