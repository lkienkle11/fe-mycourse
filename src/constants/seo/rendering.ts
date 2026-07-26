export const SEO_RENDERING_MODE = {
  SSG: "ssg",
  SSR: "ssr",
  ISR: "isr",
} as const;

/** Suggested revalidate seconds when a reviewed ISR profile exists. */
export const SEO_ISR_HINTS = {
  /** Marketing shells — only after a public cache profile is approved. */
  marketing: 300,
  /** Published catalogue cards — only after a public cache profile is approved. */
  catalogue: 60,
} as const;
