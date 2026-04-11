import { Button } from "@/components/ui/button";
import { PlayCircle, BarChart, TrendingUp, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function AdvancedPromoSection() {
  const t = await getTranslations("home");

  return (
    <section className="py-20 bg-background overflow-hidden relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Image/Video side */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none order-2 lg:order-1">
            <div className="relative">
              {/* Decorative background blob */}
              <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl -z-10" />

              <div className="relative aspect-[4/3] w-full rounded-2xl bg-slate-100 border overflow-hidden group">
                {/* Mock Image Placeholder */}
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50">
                  <span className="font-medium text-lg">
                    Promo Image Placeholder
                  </span>
                </div>

                {/* Play button overlay */}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="h-20 w-20 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center">
                    <PlayCircle className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>

              {/* Floating Stat Card */}
              <div className="absolute -bottom-6 -right-6 p-5 bg-background rounded-xl shadow-xl border flex items-center gap-4">
                <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin-slow" />
                <div>
                  <div className="text-2xl font-bold text-foreground">98%</div>
                  <div className="text-sm text-muted-foreground font-medium">
                    Completion Rate
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content side */}
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-6">
              {t("promoTitle1")}{" "}
              <span className="text-primary underline decoration-wavy decoration-primary/50 underline-offset-4">
                {t("promoTitle2")}
              </span>{" "}
              {t("promoTitle3")}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t("promoDesc")}
            </p>

            <ul className="space-y-4 mb-10">
              {[
                { icon: BarChart, textKey: "promo.list.item1" },
                { icon: TrendingUp, textKey: "promo.list.item2" },
                { icon: Users, textKey: "promo.list.item3" },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <li key={index} className="flex gap-4">
                    <div className="mt-1 bg-primary/10 p-2 text-primary rounded-lg shrink-0 h-fit">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-foreground font-medium">
                      {t(item.textKey)}
                    </span>
                  </li>
                );
              })}
            </ul>

            <Button size="lg" className="font-semibold px-8">
              {t("learnMore")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
