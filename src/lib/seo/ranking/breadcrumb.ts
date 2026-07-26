import { type JsonLdObject, requireNonEmpty } from "@/lib/seo/ranking/shared";
import type { BreadcrumbItem } from "@/types/seo/ranking";

export function buildBreadcrumbJsonLd(
  items: readonly BreadcrumbItem[],
): JsonLdObject {
  if (items.length === 0) {
    throw new Error("json-ld-missing-field:breadcrumbItems");
  }
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: requireNonEmpty(item.name, `items[${index}].name`),
      item: requireNonEmpty(item.url, `items[${index}].url`),
    })),
  };
}
