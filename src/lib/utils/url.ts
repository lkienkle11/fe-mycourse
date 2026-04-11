// ---------------------------------------------------------------------------
// buildQueryParams
// ---------------------------------------------------------------------------

/**
 * Builds a complete URL from its constituent parts.
 *
 * @param url      - Base path, e.g. `/users/:id/posts`. Returns `null` when
 *                   falsy so callers can guard cheaply.
 * @param query    - Key/value pairs appended as a query string.
 *                   Encoded via URLSearchParams (RFC 3986 safe).
 * @param params   - Named path segments that replace `:name` placeholders.
 *                   Each value is URI-encoded to prevent path injection.
 * @param fragment - Optional URL fragment appended after `#` (URI-encoded).
 *
 * @returns The assembled URL string, or `null` if `url` was empty/nullish.
 *
 * @example
 * buildQueryParams("/users/:id/posts", { page: "2" }, { id: "42" })
 * // → "/users/42/posts?page=2"
 *
 * buildQueryParams("/search", { q: "hello world" })
 * // → "/search?q=hello+world"
 */
export function buildQueryParams(
  url: string | null | undefined,
  query?: Record<string, string>,
  params?: Record<string, string>,
  fragment?: string,
): string | null {
  if (!url) return null;

  let result = url;

  // Replace :paramName placeholders with encoded path values
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      // Matches :key at end-of-string or before /, ?, or #
      result = result.replace(
        new RegExp(`:${key}(?=[/?#]|$)`, "g"),
        encodeURIComponent(value),
      );
    }
  }

  // Append query string — URLSearchParams encodes both keys and values
  if (query && Object.keys(query).length > 0) {
    const qs = new URLSearchParams(query).toString();
    const separator = result.includes("?") ? "&" : "?";
    result = `${result}${separator}${qs}`;
  }

  // Append optional fragment
  if (fragment) {
    result = `${result}#${encodeURIComponent(fragment)}`;
  }

  return result;
}
