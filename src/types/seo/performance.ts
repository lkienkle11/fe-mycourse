import type { IMAGE_SIZES_PRESETS } from "@/constants/seo/image";

export type ImageSeoPreset = keyof typeof IMAGE_SIZES_PRESETS;

export type ImageSeoPolicy = {
  sizes: string;
  /** Require alt; empty alt only when decorative and caller opts in. */
  requireAlt: true;
  /** Prefer width/height or CSS aspect-ratio to limit CLS. */
  requireIntrinsicOrAspectRatio: true;
  /**
   * Never default priority site-wide. Callers set priority only after LCP measurement.
   */
  defaultPriority: false;
};

export type ResourceHint = {
  rel: "preconnect" | "dns-prefetch";
  href: string;
  crossOrigin?: "anonymous" | "use-credentials";
};
