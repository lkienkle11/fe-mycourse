/**
 * Sanitize JSON-LD graphs before serialize (no functions, strip nullish).
 */

export function sanitizeJsonLdValue(value: unknown): unknown {
  if (value == null) return undefined;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeJsonLdValue(item))
      .filter((item) => item !== undefined);
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (typeof nested === "function") continue;
      const clean = sanitizeJsonLdValue(nested);
      if (clean !== undefined) out[key] = clean;
    }
    return out;
  }
  return undefined;
}
