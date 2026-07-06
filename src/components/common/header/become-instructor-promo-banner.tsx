"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { PUBLIC_ROUTES } from "@/constants/route";
import { useGetMe } from "@/hooks/auth/use-auth-store";
import { usePermissionSet } from "@/hooks/auth/use-permissions";
import { Link, usePathname } from "@/i18n/navigation";
import {
  BECOME_INSTRUCTOR_PROMO_BANNER_HEIGHT_PX,
  dismissBecomeInstructorBanner,
  getBecomeInstructorBannerDismissedServerSnapshot,
  getBecomeInstructorBannerDismissedSnapshot,
  subscribeBecomeInstructorBannerDismissed,
} from "@/lib/become-instructor-banner/dismiss-storage";
import { isLearnerUser } from "@/lib/utils/permission";

const PROMO_BANNER_HEIGHT_VAR = "--site-promo-banner-height";

export function BecomeInstructorPromoBanner() {
  const t = useTranslations("commonHeader.promoBanner");
  const pathname = usePathname();
  const { me, isLoading: isAuthLoading } = useGetMe();
  const permissionSet = usePermissionSet();
  const isBecomeInstructorRoute =
    pathname === PUBLIC_ROUTES.becomeInstructor ||
    pathname.startsWith(`${PUBLIC_ROUTES.becomeInstructor}/`);
  const isDismissed = useSyncExternalStore(
    subscribeBecomeInstructorBannerDismissed,
    getBecomeInstructorBannerDismissedSnapshot,
    getBecomeInstructorBannerDismissedServerSnapshot,
  );

  const showBanner =
    !isDismissed &&
    !isAuthLoading &&
    Boolean(me) &&
    isLearnerUser(permissionSet) &&
    !isBecomeInstructorRoute;

  useEffect(() => {
    const root = document.documentElement;
    if (showBanner) {
      root.style.setProperty(
        PROMO_BANNER_HEIGHT_VAR,
        `${BECOME_INSTRUCTOR_PROMO_BANNER_HEIGHT_PX}px`,
      );
      return () => {
        root.style.removeProperty(PROMO_BANNER_HEIGHT_VAR);
      };
    }
    root.style.removeProperty(PROMO_BANNER_HEIGHT_VAR);
  }, [showBanner]);

  if (!showBanner) {
    return null;
  }

  return (
    <>
      <div
        className="fixed top-0 right-0 left-0 z-30 flex items-center justify-center bg-primary text-primary-foreground"
        style={{ height: BECOME_INSTRUCTOR_PROMO_BANNER_HEIGHT_PX }}
      >
        <p className="px-12 text-center text-sm">
          {t("message")}{" "}
          <Link
            href={PUBLIC_ROUTES.becomeInstructor}
            className="font-semibold underline underline-offset-2"
          >
            {t("cta")}
          </Link>
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-3 -translate-y-1/2 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
          onClick={dismissBecomeInstructorBanner}
          aria-label={t("close")}
        >
          <X className="size-4" />
        </Button>
      </div>
      <div
        aria-hidden
        className="shrink-0"
        style={{ height: BECOME_INSTRUCTOR_PROMO_BANNER_HEIGHT_PX }}
      />
    </>
  );
}
