import { type JsonLdObject, requireNonEmpty } from "@/lib/seo/ranking/shared";
import type { ArticleJsonLdInput } from "@/types/seo/ranking";

export function buildArticleJsonLd(input: ArticleJsonLdInput): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: requireNonEmpty(input.headline, "headline"),
    description: requireNonEmpty(input.description, "description"),
    url: requireNonEmpty(input.url, "url"),
    image: requireNonEmpty(input.imageUrl, "imageUrl"),
    datePublished: requireNonEmpty(input.datePublished, "datePublished"),
    dateModified: input.dateModified?.trim() || input.datePublished,
    author: {
      "@type": "Person",
      name: requireNonEmpty(input.authorName, "authorName"),
    },
  };
}
