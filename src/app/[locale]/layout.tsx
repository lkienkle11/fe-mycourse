import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ReactNode } from "react";
import { routing } from "@/i18n/routing";
import { AppProviders } from "@/components/providers/app-providers";

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <NextIntlClientProvider>
      <AppProviders>{children}</AppProviders>
    </NextIntlClientProvider>
  );
}
