import { toast } from "sonner";
import type { ZodIssue } from "zod";

/**
 * Resolves a Zod i18n message key through a module-scoped translator.
 *
 * Convention (match auth — do not duplicate message trees):
 * - Parent namespace: `useTranslations("auth")` + schema key `validation.email`
 * - Parent namespace: `useTranslations("taxonomy.form")` + schema key `validation.name`
 *
 * Leaf `*.validation` namespaces use direct keys in components (`tValidation("title")`);
 * Zod schemas there store `validation.*`; map via `firstValidationMessageKey` before `tValidation`.
 */
export function resolveValidationMessage(
  t: (key: string) => string, // accepts next-intl scoped translators
  message: string | undefined,
): string {
  const translate = t as (key: string) => string;
  if (!message) return "";
  return translate(message);
}

/** Maps the first Zod issue message (`validation.titleMax`) to a leaf validation key (`titleMax`). */
export function firstValidationMessageKey(
  issues: ZodIssue[],
  fallback: string,
): string {
  const msg = issues[0]?.message;
  if (typeof msg === "string" && msg.startsWith("validation.")) {
    return msg.slice("validation.".length);
  }
  return fallback;
}

/** Shows a toast for the first Zod validation issue via a leaf `*.validation` translator. */
export function toastValidationError(
  tValidation: unknown,
  issues: ZodIssue[],
  fallback: string,
): void {
  const translate = tValidation as (key: string) => string;
  toast.error(translate(firstValidationMessageKey(issues, fallback)));
}
