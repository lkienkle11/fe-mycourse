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
