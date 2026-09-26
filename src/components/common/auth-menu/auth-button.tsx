"use client";

import { TimelapseIcon } from "@public/assets";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { getPathname, Link, usePathname } from "@/i18n/navigation";
import { loginHref, signupHref } from "@/lib/navigation/routes";
import { isAuthRoutePath } from "@/lib/security/web/safe-redirect";
import { cn } from "@/lib/utils";

export const AuthButton = ({
  className,
  onBeforeClickAuthButton,
}: {
  className?: string;
  onBeforeClickAuthButton?: () => void;
}) => {
  const t = useTranslations("auth");
  const locale = useLocale();
  const pathname = usePathname();
  /**
   * Already standing on `/login`/`/signup`: there is no sensible "return
   * here after logging in" destination, and a soft `Link` back to either
   * would be intercepted as a modal stacked on top of the very page it
   * targets. Force a hard navigation to the plain full page instead — same
   * outcome the user is already looking at, no self-referencing `next`, no
   * modal-over-page double render.
   */
  const onAuthRoute = isAuthRoutePath(pathname);
  const loginTarget = onAuthRoute ? loginHref() : loginHref(pathname);
  const signupTarget = onAuthRoute ? signupHref() : signupHref(pathname);

  return (
    <div className={cn("flex justify-center items-center gap-2", className)}>
      <Button
        asChild
        variant="ghost"
        className="rounded-xl border border-object-black/90 text-object-black/90 hover:cursor-pointer transition-all duration-300 px-4 py-2 text-xs leading-4"
      >
        {onAuthRoute ? (
          <a
            href={getPathname({ href: loginTarget, locale })}
            onClick={onBeforeClickAuthButton}
          >
            {t("login")}
          </a>
        ) : (
          <Link href={loginTarget} onClick={onBeforeClickAuthButton}>
            {t("login")}
          </Link>
        )}
      </Button>
      <Button
        asChild
        variant="ghost"
        className="rounded-xl bg-base-primary text-white text-xs px-4 py-2 leading-4 hover:cursor-pointer transition-all duration-300 border-none hover:bg-base-primary/90 hover:text-white"
      >
        {onAuthRoute ? (
          <a
            href={getPathname({ href: signupTarget, locale })}
            onClick={onBeforeClickAuthButton}
          >
            <TimelapseIcon />
            {t("register")}
          </a>
        ) : (
          <Link href={signupTarget} onClick={onBeforeClickAuthButton}>
            <TimelapseIcon />
            {t("register")}
          </Link>
        )}
      </Button>
    </div>
  );
};
