export type { JsonLdObject } from "@/types/seo/ranking";

export function requireNonEmpty(
  value: string | undefined | null,
  field: string,
): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    throw new Error(`json-ld-missing-field:${field}`);
  }
  return trimmed;
}
