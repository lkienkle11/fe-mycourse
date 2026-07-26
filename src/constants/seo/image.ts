/** From `src/components/home/course-card.tsx`. */
export const IMAGE_SIZES_COURSE_CARD =
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw";

/** From `src/components/home/hero-section.tsx`. */
export const IMAGE_SIZES_HERO = "(max-width: 1024px) 50vw, 33vw";

/** Full-bleed hero collage (planned signed-in `/home`). */
export const IMAGE_SIZES_HERO_FULL = "100vw";

/** From `src/components/home/advanced-promo-section.tsx`. */
export const IMAGE_SIZES_PROMO = "(max-width: 1024px) 100vw, 50vw";

export const IMAGE_SIZES_PRESETS = {
  courseCard: IMAGE_SIZES_COURSE_CARD,
  courseCardMobile: "(max-width: 640px) 100vw, 50vw",
  hero: IMAGE_SIZES_HERO,
  heroFull: IMAGE_SIZES_HERO_FULL,
  promo: IMAGE_SIZES_PROMO,
} as const;

export const FONT_CWV_OWNER = "src/lib/font.ts" as const;
