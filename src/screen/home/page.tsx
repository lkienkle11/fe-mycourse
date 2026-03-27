import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HeroSection } from "@/components/home/hero-section";
import { SearchSection } from "@/components/home/search-section";
import { TopCoursesSection } from "@/components/home/top-courses-section";
import { AdvancedPromoSection } from "@/components/home/advanced-promo-section";
import { TrendingCoursesSection } from "@/components/home/trending-courses-section";
import { UpcomingWebinarsSection } from "@/components/home/upcoming-webinars-section";
import { PromoSection } from "@/components/home/promo-section";


export async function HomePage() {
  const locale = await getLocale();
  const t = await getTranslations("home");
  const switchedLocale = locale === "vi" ? "en" : "vi";

  return (
    <main className="flex w-full flex-1 flex-col">
      <div className="w-full bg-muted/30 border-b">
        <div className="container mx-auto px-4 flex w-full items-center justify-between py-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            MyCourses.io
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              locale={switchedLocale}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted font-medium"
            >
              {t("switchLanguage")}
            </Link>
          </div>
        </div>
      </div>
      
      <HeroSection />
      <SearchSection />
      <TopCoursesSection />
      <AdvancedPromoSection />
      <TrendingCoursesSection />
      <UpcomingWebinarsSection />
      <PromoSection />
    </main>
  );
}
