import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export async function PromoSection() {
  const t = await getTranslations("homepage.cta");
  return (
    <section className="py-20 md:py-28 bg-primary/5 overflow-hidden relative">
      <div className="absolute inset-0 bg-primary/10 [mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)]" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl mb-6">
            {t("title")}
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            {t("description")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              className="font-semibold px-8 shadow-xl shadow-primary/20"
            >
              {t("getStartedFree")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="font-semibold px-8 bg-background"
            >
              {t("viewPricing")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
