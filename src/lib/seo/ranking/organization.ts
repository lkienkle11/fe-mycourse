import { type JsonLdObject, requireNonEmpty } from "@/lib/seo/ranking/shared";
import type { OrganizationJsonLdInput } from "@/types/seo/ranking";

export function buildOrganizationJsonLd(
  input: OrganizationJsonLdInput,
): JsonLdObject {
  const graph: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: requireNonEmpty(input.name, "name"),
    url: requireNonEmpty(input.url, "url"),
  };
  if (input.logoUrl?.trim()) {
    graph.logo = input.logoUrl.trim();
  }
  if (input.sameAs && input.sameAs.length > 0) {
    graph.sameAs = input.sameAs.filter((v) => v.trim());
  }
  return graph;
}
