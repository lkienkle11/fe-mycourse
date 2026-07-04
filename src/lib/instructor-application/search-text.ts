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
