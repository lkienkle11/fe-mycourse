"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useGetMe } from "@/hooks/auth";
import { Link } from "@/i18n/navigation";
import { loginHref, signedInHomeHref } from "@/lib/navigation/routes";

/**
 * Temporary signed-in homepage at `/home`.
 * Auth gate reuses the route-based login modal + `next` pattern (become-instructor State A).
 * Full Figma layout is a later task — no API fetch here.
 */
export function SignedInHomePage() {
  const t = useTranslations("home.signedIn");
  const { me, isLoading } = useGetMe();

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!me) {
    return (
      <section className="container mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("loginRequired.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("loginRequired.description")}
        </p>
        <Button asChild className="mt-6">
          <Link href={loginHref(signedInHomeHref)}>
            {t("loginRequired.login")}
          </Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="container mx-auto flex max-w-3xl flex-col gap-3 px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("temporaryNotice")}</p>
    </section>
  );
}
