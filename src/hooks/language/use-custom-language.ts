"use client";

import { useShallow } from "zustand/react/shallow";
import type { AppLanguage } from "@/lib/language/resolve-language";
import { useLanguageStore } from "@/store/language";

export type UseCustomLanguageResult = {
  /** Validated app locale code (`en` | `vi`). */
  languageCode: AppLanguage;
  /** Same as `languageCode` — alias for next-intl-style naming. */
  locale: AppLanguage;
  /** Human-readable label (e.g. Tiếng Việt, English). */
  languageLabel: string;
};

/**
 * Read current language from Zustand (kept in sync via `useSyncLanguageFromLocale`).
 */
export function useCustomLanguage(): UseCustomLanguageResult {
  return useLanguageStore(
    useShallow((s) => ({
      languageCode: s.languageCode,
      locale: s.locale,
      languageLabel: s.languageLabel,
    })),
  );
}
