import { ArrowRight, Play, Star, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export async function HeroSection() {
  const t = await getTranslations("homepage.hero");

  return (
    <section className="relative overflow-hidden bg-background pt-16 md:pt-24 lg:pt-32 pb-16">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 bg-grid-slate-100/[0.04] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Text Content */}
          <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              {t("title1")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                {t("title2")}
              </span>
            </h1>
            <p className="mt-6 text-xl leading-8 text-muted-foreground animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200 fill-mode-both">
              {t("description")}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button
                size="lg"
                className="h-12 px-8 font-medium rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
              >
                {t("exploreCourses")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 font-medium rounded-full border-2 hover:bg-muted/50 transition-all"
              >
                <Play className="mr-2 h-4 w-4 fill-current" /> {t("watchDemo")}
              </Button>
            </div>

            {/* Social Proof */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 border-t pt-8">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="inline-block h-10 w-10 rounded-full ring-2 ring-background bg-slate-200 border border-border overflow-hidden"
                    >
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center text-xs text-primary/50 font-medium">
                        U{i}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                  <div className="text-sm font-medium">
                    <p className="font-semibold text-sm">{t("joinText")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Illustration/Image */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="relative aspect-square md:aspect-[4/3] lg:aspect-square w-full rounded-2xl md:rounded-3xl bg-primary/5 border border-primary/10 shadow-2xl flex items-center justify-center overflow-hidden">
              <span className="text-xs font-medium text-slate-500">
                {t("illustration")}
              </span>

              {/* Floating elements for visual interest */}
              <div className="absolute top-10 right-10 p-3 bg-background rounded-xl shadow-xl border border-border/50 flex items-center gap-3 animate-bounce shadow-primary/5">
                <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold leading-none">4.9/5</span>
                  <p className="text-xs text-muted-foreground">
                    {t("studentRating")}
                  </p>
                </div>
              </div>

              <div className="absolute bottom-20 left-10 p-3 bg-background rounded-xl shadow-xl border border-border/50 flex items-center gap-3 animate-pulse shadow-primary/5">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold leading-none">200+</span>
                  <p className="text-xs text-muted-foreground">
                    {t("expertTutors")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
