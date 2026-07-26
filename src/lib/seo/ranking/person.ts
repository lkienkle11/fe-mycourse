import { type JsonLdObject, requireNonEmpty } from "@/lib/seo/ranking/shared";
import type { PersonJsonLdInput } from "@/types/seo/ranking";

/**
 * Person schema for public instructor pages.
 * Email is omitted from JSON-LD by default (PII) unless caller opts in later.
 */
export function buildPersonJsonLd(input: PersonJsonLdInput): JsonLdObject {
  const graph: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: requireNonEmpty(input.person.full_name, "full_name"),
    url: requireNonEmpty(input.url, "url"),
  };
  if (input.person.avatar?.trim()) {
    graph.image = input.person.avatar.trim();
  }
  if (input.jobTitle?.trim()) {
    graph.jobTitle = input.jobTitle.trim();
  }
  return graph;
}
