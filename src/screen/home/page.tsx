import { HeroSection } from "@/components/home/hero-section";
import { SearchSection } from "@/components/home/search-section";
import { TopCoursesSection } from "@/components/home/top-courses-section";
import { AdvancedPromoSection } from "@/components/home/advanced-promo-section";
import { TrendingCoursesSection } from "@/components/home/trending-courses-section";
import { UpcomingWebinarsSection } from "@/components/home/upcoming-webinars-section";
import { PromoSection } from "@/components/home/promo-section";

export async function HomePage() {
  return (
    <main className="flex w-full flex-1 flex-col">
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
