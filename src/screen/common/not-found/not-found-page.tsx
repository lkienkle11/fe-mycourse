import notFoundThumbnail from "@public/assets/images/common/thumbnail-page-not-found.png";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { homeHref } from "@/lib/navigation/home";
import { cn } from "@/lib/utils";

type NotFoundPageProps = {
  /** `(web)/layout` already renders Header — pass false to avoid duplicate chrome. */
  showHeader?: boolean;
};

export async function NotFoundPage({ showHeader = true }: NotFoundPageProps) {
  const t = await getTranslations("notFound");

  return (
    <>
      {showHeader ? <Header /> : null}
      <main className="flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center bg-background px-4 py-10">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
          <Image
            src={notFoundThumbnail}
            alt={t("imageAlt")}
            priority
            className="h-auto w-full max-w-[660px]"
          />

          <h1 className="text-4xl font-medium text-foreground md:text-5xl">
            {t("title")}
          </h1>

          <div className="space-y-1 text-lg text-muted-foreground">
            <p>{t("descriptionLine1")}</p>
            <p>{t("descriptionLine2")}</p>
          </div>

          <Button
            asChild
            className={cn("h-12 rounded-[14px] px-8 font-medium")}
          >
            <Link href={homeHref}>{t("backToHome")}</Link>
          </Button>
        </div>
      </main>
    </>
  );
}
