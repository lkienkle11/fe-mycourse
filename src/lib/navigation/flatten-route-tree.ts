/**
 * Shared recursion over nested route-constant trees → flat string paths.
 * Used by crawl-policy and sitemap private-path helpers — do not duplicate.
 */

export function flattenRouteTreePaths(
  node: unknown,
  out: string[] = [],
): string[] {
  if (typeof node === "string") {
    out.push(node);
    return out;
  }
  if (node && typeof node === "object") {
    for (const value of Object.values(node as Record<string, unknown>)) {
      flattenRouteTreePaths(value, out);
    }
  }
  return out;
}
