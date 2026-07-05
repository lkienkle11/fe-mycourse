export function removeDiacritics(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export function normalizeSearchText(value: string): string {
  return removeDiacritics(value.toLowerCase().trim());
}

/** Lowercase label key for dedupe / exact company-name match (no diacritics). */
export function normalizeDedupeKey(value: string): string {
  return normalizeSearchText(value).replace(/[.,-]/g, "");
}

/**
 * Normalize a free-text dedup key: trim, lowercase, and collapse internal
 * whitespace runs (incl. tabs/newlines) to a single space. Mirrors BE
 * `sharedutils.NormalizeDedupeKey` so certificate composite keys compare
 * equal across FE validation and BE enforcement ("AWS" matches "aws",
 * "AWS  Certified" matches "AWS Certified"). Intentionally keeps diacritics
 * and punctuation — only case and whitespace are normalized.
 */
export function normalizeCompositeKey(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

export function normalizeDomainKey(value: string): string {
  return normalizeSearchText(value).replace(/^www\./, "");
}

export function slugifyKey(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "untitled"
  );
}
