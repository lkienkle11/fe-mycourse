"use client";

import {
  type LucideIcon,
  ServerCrashIcon,
  ShieldAlertIcon,
  ShieldXIcon,
  WifiOffIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { homeHref } from "@/lib/navigation/home";
import { cn } from "@/lib/utils";
import type { StatusErrorVariant } from "@/lib/utils/api-error";

export type StatusErrorPageAction =
  | { label: string; href: string; onClick?: never }
  | { label: string; href?: never; onClick: () => void };

export type StatusErrorPageProps = {
  variant: StatusErrorVariant;
  title?: string;
  description?: string;
  action?: StatusErrorPageAction;
  /**
   * `true` when this is the only content between a page's header and footer
   * (e.g. rendered as a page's entire body) — fills the viewport below a
   * ~4rem header, matching `NotFoundPage`'s convention, so the footer lands
   * at the bottom of the screen instead of right under the card. Defaults to
   * `false` (a bounded `min-h-[50vh]`), which is the safe choice when this
   * renders embedded inside another page's own content area (e.g.
   * `editor-page.tsx`'s dashboard shell) — filling the viewport there would
   * overflow that shell instead of the browser window.
   */
  fillViewport?: boolean;
};

const VARIANT_ICON: Record<StatusErrorVariant, LucideIcon> = {
  unauthorized: ShieldAlertIcon,
  forbidden: ShieldXIcon,
  "server-error": ServerCrashIcon,
  network: WifiOffIcon,
};

/**
 * Shared full-page state for a status-classified failure (unauthorized,
 * forbidden, server-error, network). Generalized from `NotFoundPage`'s
 * layout so every screen renders these the same way instead of a bespoke
 * fallback per screen. A route that doesn't match still goes through
 * `NotFoundPage` (`not-found.tsx`), not this component.
 */
export function StatusErrorPage({
  variant,
  title,
  description,
  action,
  fillViewport = false,
}: StatusErrorPageProps) {
  const t = useTranslations("errors.statusPage");
  const Icon = VARIANT_ICON[variant];
  const resolvedTitle = title ?? t(`${variant}.title`);
  const resolvedDescription = description ?? t(`${variant}.description`);
  const resolvedAction = action ?? {
    label: t("action.backToHome"),
    href: homeHref,
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-background px-4 py-10",
        fillViewport ? "min-h-[calc(100svh-4rem)]" : "min-h-[50vh]",
      )}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-8 rounded-[1.25rem] bg-card px-10 py-12 text-center shadow-xl">
        <Icon
          aria-hidden
          className="size-16 text-muted-foreground"
          strokeWidth={1.5}
        />

        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold text-foreground">
            {resolvedTitle}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            {resolvedDescription}
          </p>
        </div>

        <Button asChild className={cn("h-12 rounded-[14px] px-8 font-medium")}>
          {resolvedAction.href ? (
            <Link href={resolvedAction.href}>{resolvedAction.label}</Link>
          ) : (
            <button type="button" onClick={resolvedAction.onClick}>
              {resolvedAction.label}
            </button>
          )}
        </Button>
      </div>
    </div>
  );
}
