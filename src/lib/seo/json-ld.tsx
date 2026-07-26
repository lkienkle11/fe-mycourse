import { sanitizeJsonLdValue } from "@/lib/security/web/sanitize-json-ld";
import type { JsonLdObject } from "@/lib/seo/ranking/shared";

type JsonLdProps = {
  data: JsonLdObject | readonly JsonLdObject[];
  id?: string;
};

/**
 * Server-friendly JSON-LD script. Escapes `<` to `\u003c` before embed.
 * Place under src/lib/seo (not src/components) while unused — Knip files policy.
 */
export function JsonLd({ data, id }: JsonLdProps) {
  const sanitized = sanitizeJsonLdValue(data);
  const json = JSON.stringify(sanitized).replace(/</g, "\\u003c");
  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires script body; content is sanitized + < escaped.
      dangerouslySetInnerHTML={{ __html: json }}
      id={id}
      type="application/ld+json"
    />
  );
}
