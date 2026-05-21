"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";
import { useLanguageStore } from "@/store/language";

/**
 * Sync next-intl route locale into `useLanguageStore`.
 * Mount once in `AppProviders` (same pattern as `useSyncMeFromAuth`).
 */
export function useSyncLanguageFromLocale(): void {
  const locale = useLocale();
  const setFromLocale = useLanguageStore((s) => s.setFromLocale);

  useEffect(() => {
    setFromLocale(locale);
  }, [locale, setFromLocale]);
}
