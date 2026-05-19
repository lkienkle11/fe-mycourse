import {
  Briefcase,
  Camera,
  Code,
  LineChart,
  Music,
  Palette,
  Search,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export async function SearchSection() {
  const t = await getTranslations("homepage.search");

  const categories = [
    { name: "Development", icon: Code },
    { name: "Design", icon: Palette },
    { name: "Marketing", icon: LineChart },
    { name: "Business", icon: Briefcase },
    { name: "Photography", icon: Camera },
    { name: "Music", icon: Music },
  ];

  return (
    <section className="py-12 bg-background border-b relative z-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto -mt-24 bg-card rounded-3xl p-6 md:p-8 shadow-2xl border border-border">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              className="w-full h-14 pl-12 pr-32 rounded-2xl border-2 border-primary/20 bg-background text-lg shadow-sm focus-visible:ring-primary/30 focus-visible:border-primary transition-all"
              placeholder={t("placeholder")}
            />
            <Button className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6 rounded-xl font-medium">
              {t("button")}
            </Button>
          </div>

          <div className="mt-8 flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
              {t("popularCategories")}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.name}
                    variant="secondary"
                    size="sm"
                    className="rounded-full bg-secondary/50 hover:bg-secondary font-medium transition-colors"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {category.name}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
