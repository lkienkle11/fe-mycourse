import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { homeHref } from "@/lib/navigation/home";
import { buildPageMetadata } from "@/lib/seo/build-page-metadata";
import { JsonLd } from "@/lib/seo/json-ld";
import { buildOrganizationJsonLd } from "@/lib/seo/ranking/organization";
import { resolveSiteConfig } from "@/lib/seo/site-config";
import { HomePage } from "@/screen";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: "homepage.seo",
  });
  return buildPageMetadata(
    {
      locale: resolvedLocale,
      pathname: homeHref,
      title: t("title"),
      description: t("description"),
    },
    { site: { readEnv: true } },
  );
}

export default function LocalePage() {
  const site = resolveSiteConfig({ readEnv: true });
  return (
    <>
      <JsonLd
        data={buildOrganizationJsonLd({
          name: site.siteName,
          url: site.siteUrl,
        })}
      />
      <HomePage />
    </>
  );
}
