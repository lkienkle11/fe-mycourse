"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { HeroCarousel } from "@/components/home/signed-in/hero-carousel";
import { HomeContinueLearningSection } from "@/components/home/signed-in/home-continue-learning-section";
import { HomePopularInstructorsSection } from "@/components/home/signed-in/home-popular-instructors-section";
import { HomeTrendingSection } from "@/components/home/signed-in/home-trending-section";
import { Button } from "@/components/ui/button";
import { useGetMe } from "@/hooks/auth";
import { Link } from "@/i18n/navigation";
import { loginHref, signedInHomeHref } from "@/lib/navigation/routes";

/**
 * Signed-in homepage at `/home`: hero carousel, Complete your Course, Trending Course and Popular Instructor.
 * Auth gate reuses the route-based login modal + `next` pattern (become-instructor State A);
 * no home data is requested for a guest.
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
    <div className="container mx-auto flex max-w-[1229px] flex-col gap-11 px-4 py-6">
      <HeroCarousel />
      <HomeContinueLearningSection />
      <HomeTrendingSection />
      <HomePopularInstructorsSection />
    </div>
  );
}
