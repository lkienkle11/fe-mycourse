import { type JsonLdObject, requireNonEmpty } from "@/lib/seo/ranking/shared";
import type { FaqItem } from "@/types/seo/ranking";

/**
 * FAQPage only when Q&A is actually rendered on the page.
 */
export function buildFaqJsonLd(items: readonly FaqItem[]): JsonLdObject {
  if (items.length === 0) {
    throw new Error("json-ld-missing-field:faqItems");
  }
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item, index) => ({
      "@type": "Question",
      name: requireNonEmpty(item.question, `items[${index}].question`),
      acceptedAnswer: {
        "@type": "Answer",
        text: requireNonEmpty(item.answer, `items[${index}].answer`),
      },
    })),
  };
}
