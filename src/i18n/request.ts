import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { loadMessages, preloadAllMessages } from "@/lib/i18n/load-messages";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  if (process.env.NODE_ENV === "development") {
    await preloadAllMessages();
  }

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
