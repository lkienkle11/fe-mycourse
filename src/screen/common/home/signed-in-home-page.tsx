"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PRIVATE_ROUTES } from "@/constants/route";
import { useAuthStore, useGetMe } from "@/hooks/auth";

/**
 * Temporary signed-in homepage at `/home`.
 * Auth gate reuses the login modal + nextLink pattern (become-instructor State A).
 * Full Figma layout is a later task — no API fetch here.
 */
export function SignedInHomePage() {
  const t = useTranslations("home.signedIn");
  const { me, isLoading } = useGetMe();
  const { openLoginModal } = useAuthStore();

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
        <Button
          className="mt-6"
          type="button"
          onClick={() => openLoginModal(PRIVATE_ROUTES.home)}
        >
          {t("loginRequired.login")}
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
