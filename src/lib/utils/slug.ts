export const SLUG_MAX_LENGTH = 255;

/** Final accepted slug shape: `a-z`, `0-9`, `-`; no leading or trailing `-`. */
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/**
 * Filters editable slug input as the user types or pastes: whitespace becomes
 * `-`, every character outside `a-z`, `0-9`, `-` is dropped, length is capped.
 * Dashes are kept as typed so partial input stays stable.
 */
export function sanitizeSlugInput(value: string): string {
  return value
    .replace(/\s/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, SLUG_MAX_LENGTH);
}

/** True when a slug was sent and the server stored a different one (e.g. a suffix was added). */
export function isSlugAdjusted(
  sentSlug: string | undefined,
  savedSlug: string,
): boolean {
  return sentSlug !== undefined && sentSlug !== savedSlug;
}
