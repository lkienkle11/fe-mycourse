import { create } from "zustand";
import { routing } from "@/i18n/routing";
import {
  type CustomLanguage,
  resolveCustomLanguage,
} from "@/lib/language/resolve-language";

export type LanguageStoreState = CustomLanguage & {
  setFromLocale: (locale: string) => void;
};

const initialLanguage = resolveCustomLanguage(routing.defaultLocale);

export const useLanguageStore = create<LanguageStoreState>((set) => ({
  ...initialLanguage,
  setFromLocale: (locale) => set(resolveCustomLanguage(locale)),
}));
