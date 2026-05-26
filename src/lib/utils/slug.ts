/**
 * Builds a URL slug from a display name: lowercase, spaces → `-`, strip accents.
 * Example: "36 Thanh Hóa" → "36-thanh-hoa"
 */
export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
