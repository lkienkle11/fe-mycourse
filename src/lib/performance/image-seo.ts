/**
 * Image sizes / LCP / CLS policy presets.
 * Derived from home course-card + hero + promo `sizes` patterns.
 * Not a next/image wrapper.
 */

import { IMAGE_SIZES_PRESETS } from "@/constants/seo/image";
import { isImageFilename } from "@/lib/utils/media";
import type { ImageSeoPolicy, ImageSeoPreset } from "@/types/seo/performance";

export {
  FONT_CWV_OWNER,
  IMAGE_SIZES_COURSE_CARD,
  IMAGE_SIZES_HERO,
  IMAGE_SIZES_HERO_FULL,
  IMAGE_SIZES_PRESETS,
  IMAGE_SIZES_PROMO,
} from "@/constants/seo/image";

export function imageSeoPolicy(preset: ImageSeoPreset): ImageSeoPolicy {
  return {
    sizes: IMAGE_SIZES_PRESETS[preset],
    requireAlt: true,
    requireIntrinsicOrAspectRatio: true,
    defaultPriority: false,
  };
}

/** Validate OG/image path extension when a filename is known. */
export function isAllowedSeoImagePath(pathOrFilename: string): boolean {
  const cleaned = pathOrFilename.split("?")[0]?.split("#")[0] ?? "";
  const base = cleaned.includes("/")
    ? (cleaned.split("/").pop() ?? cleaned)
    : cleaned;
  return isImageFilename(base);
}
