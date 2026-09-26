/**
 * Guards a post-login/signup return path against open redirect.
 * Does not replace authentication or authorization.
 */

/**
 * True when `path` is a same-origin, relative internal path: starts with a
 * single `/`, contains no scheme (`://`), and is not protocol-relative
 * (`//...`) or backslash-prefixed (a browser normalizes a leading `\` like
 * `/`, which some parsers treat as protocol-relative too).
 *
 * Rejects any ASCII tab/newline/CR outright: the WHATWG URL parser (used by
 * browsers and by Next.js's router when resolving a navigation target)
 * strips those characters before parsing, so a value like `/\t/evil.com`
 * would otherwise pass every check above yet resolve to the
 * protocol-relative `//evil.com` once actually navigated to.
 */
export function isSafeInternalPath(
  path: string | null | undefined,
): path is string {
  if (!path) return false;
  if (/[\t\n\r]/.test(path)) return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.startsWith("/\\") || path.startsWith("\\")) return false;
  if (path.includes("://")) return false;
  return true;
}

const AUTH_ROUTE_PATHS = new Set(["/login", "/signup"]);

/**
 * True when `path` (a next-intl `usePathname()` value, already locale-stripped)
 * is `/login` or `/signup` themselves. A post-login/signup `next` destination
 * must never resolve to one of these: "return to the login page after logging
 * in" is meaningless and, worse, creates a self-referencing `next` that keeps
 * getting forwarded across every login/signup cross-link.
 */
export function isAuthRoutePath(path: string | null | undefined): boolean {
  return !!path && AUTH_ROUTE_PATHS.has(path);
}
