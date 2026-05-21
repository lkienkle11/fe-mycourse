import { LANGUAGE_OPTIONS } from "@/constants";
import { routing } from "@/i18n/routing";

export type AppLanguage = (typeof routing.locales)[number];

export type CustomLanguage = {
  languageCode: AppLanguage;
  locale: AppLanguage;
  languageLabel: string;
};

export function resolveLanguageCode(locale: string): AppLanguage {
  return (routing.locales as readonly AppLanguage[]).includes(
    locale as AppLanguage,
  )
    ? (locale as AppLanguage)
    : routing.defaultLocale;
}

/** Resolve language code + display label from a next-intl / URL locale string. */
export function resolveCustomLanguage(locale: string): CustomLanguage {
  const languageCode = resolveLanguageCode(locale);
  const languageLabel =
    LANGUAGE_OPTIONS.find((item) => item.locale === languageCode)?.label ??
    "Language";

  return {
    languageCode,
    locale: languageCode,
    languageLabel,
  };
}
