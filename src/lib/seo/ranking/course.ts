import { type JsonLdObject, requireNonEmpty } from "@/lib/seo/ranking/shared";
import { coerceToDelta, extractPlainText } from "@/lib/utils/course-delta";
import { truncateUnicodeCodePoints } from "@/lib/utils/unicode-length";
import type { CourseJsonLdInput } from "@/types/seo/ranking";

function descriptionFromCourse(input: CourseJsonLdInput): string {
  const short = input.course.short_description?.trim();
  if (short) return truncateUnicodeCodePoints(short, 300);

  const about = input.aboutDeltaOrPlain?.trim() || input.course.about_course;
  if (!about?.trim()) {
    throw new Error("json-ld-missing-field:description");
  }

  const plain = extractPlainText(coerceToDelta(about)).trim();
  if (!plain) throw new Error("json-ld-missing-field:description");
  return truncateUnicodeCodePoints(plain, 300);
}

/**
 * Course schema from real domain fields only.
 * Does not invent AggregateRating, Offer, or review counts.
 */
export function buildCourseJsonLd(input: CourseJsonLdInput): JsonLdObject {
  const name = requireNonEmpty(input.course.title, "title");
  const url = requireNonEmpty(input.url, "url");
  const description = descriptionFromCourse(input);
  const graph: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description,
    url,
    provider: {
      "@type": "Organization",
      name: requireNonEmpty(input.providerName, "providerName"),
    },
  };
  if (input.course.thumbnail_url?.trim()) {
    graph.image = input.course.thumbnail_url.trim();
  }
  if (input.course.slug?.trim()) {
    graph.identifier = input.course.slug.trim();
  }
  return graph;
}
