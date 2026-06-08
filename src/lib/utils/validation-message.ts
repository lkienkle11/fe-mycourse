/**
 * Resolves a Zod i18n message key through a module-scoped translator.
 *
 * Convention (match auth — do not duplicate message trees):
 * - Parent namespace: `useTranslations("auth")` + schema key `validation.email`
 * - Parent namespace: `useTranslations("taxonomy.form")` + schema key `validation.name`
 *
 * Leaf `*.validation` namespaces use direct keys in components (`tValidation("title")`);
 * Zod schemas there still store `validation.*` but callers map failures manually.
 */
export function resolveValidationMessage(
  t: (key: string) => string, // accepts next-intl scoped translators
  message: string | undefined,
): string {
  const translate = t as (key: string) => string;
  if (!message) return "";
  return translate(message);
}
