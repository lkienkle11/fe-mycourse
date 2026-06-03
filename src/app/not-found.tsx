import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { AppProviders } from "@/components/providers/app-providers";
import { NotFoundPage } from "@/screen/common/not-found/not-found-page";

export async function generateMetadata() {
  const t = await getTranslations("notFound");
  return { title: t("metaTitle") };
}

/**
 * Global 404 — outside `[locale]/layout`. Reuse the same provider stack as
 * `src/app/[locale]/layout.tsx` (no new provider module).
 */
export default async function NotFound() {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppProviders>
        <NotFoundPage />
      </AppProviders>
    </NextIntlClientProvider>
  );
}
