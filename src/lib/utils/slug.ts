/**
 * Builds a URL slug from a display name: lowercase, spaces → `-`, strip accents.
 * Example: "36 Thanh Hóa" → "36-thanh-hoa"
 */
export function generateSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function slugifyName(name: string): string {
  return generateSlug(name);
}

export const SLUG_MAX_LENGTH = 255;

/** Final accepted slug shape: `a-z`, `0-9`, `-`; no leading or trailing `-`. */
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/**
 * Filters editable slug input as the user types or pastes: whitespace becomes
 * `-`, every character outside `a-z`, `0-9`, `-` is dropped, length is capped.
 * Unlike `generateSlug` it keeps dashes as typed so partial input stays stable.
 */
export function sanitizeSlugInput(value: string): string {
  return value
    .replace(/\s/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, SLUG_MAX_LENGTH);
}
