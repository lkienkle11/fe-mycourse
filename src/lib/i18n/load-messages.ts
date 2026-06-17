import type { AbstractIntlMessages } from "next-intl";
import { routing } from "@/i18n/routing";

type Locale = (typeof routing.locales)[number];

const localeLoaders: Record<
  Locale,
  () => Promise<{ default: AbstractIntlMessages }>
> = {
  en: () => import("@/messages/en"),
  vi: () => import("@/messages/vi"),
};

export async function loadMessages(
  locale: Locale,
): Promise<AbstractIntlMessages> {
  const load = localeLoaders[locale];
  if (!load) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
  return (await load()).default;
}

let preloadedMessages: Record<Locale, AbstractIntlMessages> | null = null;

/** Validate all locales load (dev/build guard). Cached after first call in a process. */
export async function preloadAllMessages(): Promise<
  Record<Locale, AbstractIntlMessages>
> {
  if (preloadedMessages) {
    return preloadedMessages;
  }

  const entries = await Promise.all(
    routing.locales.map(
      async (locale) => [locale, await loadMessages(locale)] as const,
    ),
  );
  preloadedMessages = Object.fromEntries(entries) as Record<
    Locale,
    AbstractIntlMessages
  >;
  return preloadedMessages;
}
