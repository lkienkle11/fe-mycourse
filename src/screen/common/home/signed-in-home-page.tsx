"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { HeroCarousel } from "@/components/home/signed-in/hero-carousel";
import { HomeContinueLearningSection } from "@/components/home/signed-in/home-continue-learning-section";
import { HomePopularInstructorsSection } from "@/components/home/signed-in/home-popular-instructors-section";
import { HomeTrendingSection } from "@/components/home/signed-in/home-trending-section";
import { MeOutagePage } from "@/components/shared/me-outage-page";
import { StatusErrorPage } from "@/components/shared/status-error-page";
import { useGetMe, useMeOutage } from "@/hooks/auth";
import { loginHref, signedInHomeHref } from "@/lib/navigation/routes";

/**
 * Signed-in homepage at `/home`: hero carousel, Complete your Course, Trending Course and Popular Instructor.
 * Auth gate reuses the route-based login modal + `next` pattern (become-instructor State A);
 * no home data is requested for a guest.
 */
export function SignedInHomePage() {
  const t = useTranslations("home.signedIn");
  const { me, isLoading } = useGetMe();
  const meOutage = useMeOutage();

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (meOutage) return <MeOutagePage outage={meOutage} fillViewport />;

  if (!me) {
    return (
      <StatusErrorPage
        variant="unauthorized"
        title={t("loginRequired.title")}
        description={t("loginRequired.description")}
        action={{
          label: t("loginRequired.login"),
          href: loginHref(signedInHomeHref),
        }}
        fillViewport
      />
    );
  }

  return (
    <div className="container mx-auto flex max-w-[1229px] flex-col gap-11 px-4 py-6">
      <HeroCarousel />
      <HomeContinueLearningSection />
      <HomeTrendingSection />
      <HomePopularInstructorsSection />
    </div>
  );
}
