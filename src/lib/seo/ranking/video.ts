import { type JsonLdObject, requireNonEmpty } from "@/lib/seo/ranking/shared";
import type { VideoJsonLdInput } from "@/types/seo/ranking";

/**
 * VideoObject only when public URL, thumbnail, duration, and upload date are real.
 */
export function buildVideoJsonLd(input: VideoJsonLdInput): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: requireNonEmpty(input.name, "name"),
    description: requireNonEmpty(input.description, "description"),
    thumbnailUrl: requireNonEmpty(input.thumbnailUrl, "thumbnailUrl"),
    contentUrl: requireNonEmpty(input.contentUrl, "contentUrl"),
    uploadDate: requireNonEmpty(input.uploadDate, "uploadDate"),
    duration: requireNonEmpty(input.duration, "duration"),
  };
}
