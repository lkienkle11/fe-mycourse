import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { AppProviders } from "@/components/providers/app-providers";
import { routing } from "@/i18n/routing";

type LocaleLayoutProps = {
  children: ReactNode;
  modal: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  modal,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <NextIntlClientProvider>
      <AppProviders>
        {children}
        {modal}
      </AppProviders>
    </NextIntlClientProvider>
  );
}
