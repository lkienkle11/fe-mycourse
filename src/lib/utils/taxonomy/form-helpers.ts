import { LANGUAGE_OPTIONS } from "@/constants";
import { slugifyName } from "@/lib/utils";
import type {
  CourseOutcome,
  CourseTopic,
  SlugStatusTaxonomy,
  TaxonomyEntity,
  TaxonomyNodeTranslation,
  TaxonomyOutcomeTranslation,
  TaxonomyResourceKey,
  TaxonomyTreeNode,
} from "@/types/taxonomy";

export const TAXONOMY_TREE_INDENT_PX = 12;
export const TAXONOMY_DIALOG_BASE_MIN_PX = 672;
export const DEFAULT_CONTENT_LOCALES = ["en", "vi"] as const;

/** Max locale length — mirrors BE `i18n.MaxLocaleLen` / DB varchar(16). */
export const MAX_CONTENT_LOCALE_LEN = 16;

/** Canonicalize BCP47 for form tabs (mirrors BE write rules loosely for client UX). */
export function canonicalizeContentLocale(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const parts = s.split("-");
  // Primary language: 2–8 letters (BCP47 / BE isLanguageSubtag).
  if (!parts[0] || !/^[A-Za-z]{2,8}$/.test(parts[0])) return null;
  const out: string[] = [parts[0].toLowerCase()];
  for (let i = 1; i < parts.length; i += 1) {
    const p = parts[i];
    if (!p) return null;
    if (/^[A-Za-z]{4}$/.test(p)) {
      out.push(p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
      continue;
    }
    if (/^[A-Za-z]{2}$/.test(p) || /^[0-9]{3}$/.test(p)) {
      out.push(p.toUpperCase());
      continue;
    }
    if (/^[A-Za-z0-9]{1,8}$/.test(p)) {
      out.push(p.toLowerCase());
      continue;
    }
    return null;
  }
  const canon = out.join("-");
  if (canon.length > MAX_CONTENT_LOCALE_LEN) return null;
  return canon;
}

export function uniqueLocales(locales: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const locale of locales) {
    const key = canonicalizeContentLocale(locale) ?? locale.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

export function collectTabLocales(
  translationKeys: string[],
  availableLocales: string[] | undefined,
  extraLocales: string[],
): string[] {
  const set = new Set<string>([
    ...DEFAULT_CONTENT_LOCALES,
    ...(availableLocales ?? []),
    ...translationKeys,
    ...extraLocales,
  ]);
  const rest = [...set]
    .filter((locale) => locale !== "en" && locale !== "vi")
    .sort();
  return ["en", "vi", ...rest].filter((locale) => set.has(locale));
}

export function localeTabLabel(locale: string): string {
  return contentLocaleOptionLabel(locale);
}

export function buildNameTranslations(
  initialData?: TaxonomyEntity | null,
): Record<string, TaxonomyNodeTranslation> {
  if (!initialData || !("name" in initialData)) {
    return { en: { name: "" }, vi: { name: "" } };
  }
  const row = initialData as SlugStatusTaxonomy;
  const translations: Record<string, TaxonomyNodeTranslation> = {
    ...(row.translations ?? {}),
  };
  if (row.name && !translations.en?.name) {
    translations.en = { name: row.name };
  }
  if (!translations.en) translations.en = { name: row.name ?? "" };
  if (!translations.vi) translations.vi = { name: "" };
  return translations;
}

export function buildOutcomeTranslations(
  initialData?: TaxonomyEntity | null,
): Record<string, TaxonomyOutcomeTranslation> {
  if (!initialData || !("short_description" in initialData)) {
    return {
      en: { short_description: "", description: [""] },
      vi: { short_description: "", description: [""] },
    };
  }
  const row = initialData as CourseOutcome;
  const translations: Record<string, TaxonomyOutcomeTranslation> = {};
  for (const [locale, value] of Object.entries(row.translations ?? {})) {
    translations[locale] = {
      short_description: value.short_description ?? "",
      description: value.description?.length ? [...value.description] : [""],
    };
  }
  if (!translations.en) {
    translations.en = {
      short_description: row.short_description ?? "",
      description: row.description?.length ? [...row.description] : [""],
    };
  }
  if (!translations.vi) {
    translations.vi = { short_description: "", description: [""] };
  }
  return translations;
}

export function buildTaxonomyFormDefaultValues(
  resourceKey: TaxonomyResourceKey,
  initialData?: TaxonomyEntity | null,
) {
  if (resourceKey === "outcomes") {
    const row = initialData as CourseOutcome | undefined;
    const en = buildOutcomeTranslations(initialData).en;
    return {
      short_description: en?.short_description ?? row?.short_description ?? "",
      description: en?.description ?? row?.description ?? [],
      image_file_id: row?.image_file_id ?? "",
      status: row?.status ?? "ACTIVE",
    };
  }

  const row = initialData as SlugStatusTaxonomy | undefined;
  const enName = buildNameTranslations(initialData).en?.name ?? row?.name ?? "";
  return {
    name: enName,
    status: row?.status ?? "ACTIVE",
    short_description: "",
    description: [],
    image_file_id:
      resourceKey === "topics"
        ? ((initialData as CourseTopic | undefined)?.image_file_id ?? "")
        : "",
    child_topics: [],
    children: [],
  };
}

export function buildTaxonomyInitialImageFileURL(
  resourceKey: TaxonomyResourceKey,
  initialData?: TaxonomyEntity | null,
): string {
  if (resourceKey === "outcomes") {
    return (initialData as CourseOutcome | undefined)?.image_file_url ?? "";
  }
  if (resourceKey === "topics") {
    return (initialData as CourseTopic | undefined)?.image_file_url ?? "";
  }
  return "";
}

export function getPersistedTaxonomySlug(
  resourceKey: TaxonomyResourceKey,
  initialData?: TaxonomyEntity | null,
): string {
  if (resourceKey === "outcomes" || !initialData) return "";
  return (initialData as SlugStatusTaxonomy).slug ?? "";
}

export function resolveTaxonomySlugPreview(
  name: string,
  persistedSlug: string,
): string {
  const trimmed = name.trim();
  if (trimmed) return slugifyName(trimmed);
  return persistedSlug;
}

export function getTaxonomyTreeMaxDepth(nodes: TaxonomyTreeNode[]): number {
  let max = 0;
  const visit = (items: TaxonomyTreeNode[], depth: number) => {
    for (const node of items) {
      max = Math.max(max, depth);
      if (node.children?.length) {
        visit(node.children, depth + 1);
      }
    }
  };
  visit(nodes, 0);
  return max;
}

export function compactNameTranslations(
  translations: Record<string, TaxonomyNodeTranslation>,
): Record<string, TaxonomyNodeTranslation> {
  const out: Record<string, TaxonomyNodeTranslation> = {};
  for (const [locale, value] of Object.entries(translations)) {
    const name = value.name.trim();
    if (!name) continue;
    out[locale] = { name };
  }
  return out;
}

export function compactOutcomeTranslations(
  translations: Record<string, TaxonomyOutcomeTranslation>,
): Record<string, TaxonomyOutcomeTranslation> {
  const out: Record<string, TaxonomyOutcomeTranslation> = {};
  for (const [locale, value] of Object.entries(translations)) {
    const shortDescription = value.short_description.trim();
    const description = (value.description ?? [])
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (!shortDescription && description.length === 0) continue;
    out[locale] = {
      short_description: shortDescription,
      description,
    };
  }
  return out;
}

/** Returns a locale code that has description content but empty short_description. */
export function findOutcomeTranslationMissingShort(
  translations: Record<string, TaxonomyOutcomeTranslation>,
): string | null {
  for (const [locale, value] of Object.entries(translations)) {
    const shortDescription = value.short_description.trim();
    const hasDescription = (value.description ?? []).some(
      (line) => line.trim().length > 0,
    );
    if (hasDescription && !shortDescription) {
      return locale;
    }
  }
  return null;
}

export const CONTENT_LOCALE_OPTIONS: ReadonlyArray<{
  locale: string;
  label: string;
}> = [
  ...LANGUAGE_OPTIONS.map((item) => ({
    locale: item.locale,
    label: `${item.label} (${item.locale})`,
  })),
  { locale: "en-US", label: "English (United States) (en-US)" },
  { locale: "en-GB", label: "English (United Kingdom) (en-GB)" },
  { locale: "pt-BR", label: "Portuguese (Brazil) (pt-BR)" },
  { locale: "pt-PT", label: "Portuguese (Portugal) (pt-PT)" },
  { locale: "fr", label: "French (fr)" },
  { locale: "fr-FR", label: "French (France) (fr-FR)" },
  { locale: "de", label: "German (de)" },
  { locale: "de-DE", label: "German (Germany) (de-DE)" },
  { locale: "es", label: "Spanish (es)" },
  { locale: "es-ES", label: "Spanish (Spain) (es-ES)" },
  { locale: "ja", label: "Japanese (ja)" },
  { locale: "ko", label: "Korean (ko)" },
  { locale: "zh", label: "Chinese (zh)" },
  { locale: "zh-Hans", label: "Chinese (Simplified) (zh-Hans)" },
  { locale: "zh-Hant", label: "Chinese (Traditional) (zh-Hant)" },
  { locale: "id", label: "Indonesian (id)" },
  { locale: "th", label: "Thai (th)" },
];

const ALLOWED_CONTENT_LOCALE_SET = new Set(
  CONTENT_LOCALE_OPTIONS.map((item) => item.locale),
);

/** True when locale is an exact preset key in `CONTENT_LOCALE_OPTIONS`. */
export function isAllowedContentLocale(locale: string): boolean {
  return ALLOWED_CONTENT_LOCALE_SET.has(locale);
}

/**
 * Canonicalize then whitelist against `CONTENT_LOCALE_OPTIONS`.
 * Used for add-locale (dropdown-only — no free-enter of arbitrary BCP47).
 */
export function resolveAllowedContentLocale(raw: string): string | null {
  const canon = canonicalizeContentLocale(raw);
  if (!canon || !isAllowedContentLocale(canon)) return null;
  return canon;
}

export function contentLocaleOptionLabel(locale: string): string {
  const fromContent = CONTENT_LOCALE_OPTIONS.find(
    (item) => item.locale === locale,
  );
  if (fromContent) return fromContent.label;
  const fromLanguage = LANGUAGE_OPTIONS.find((item) => item.locale === locale);
  if (fromLanguage) return fromLanguage.label;
  return locale;
}
