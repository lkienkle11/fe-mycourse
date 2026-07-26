import type { PUBLIC_ROUTES } from "@/constants/route";

/**
 * Allow-list of public route keys eligible for sitemap / crawl-allow.
 * Public-routable does not imply SEO-indexable.
 */
export const SEO_INDEXABLE_PUBLIC_ROUTE_KEYS = [
  "home",
] as const satisfies ReadonlyArray<keyof typeof PUBLIC_ROUTES>;

/** Planned route only; it is not registered in PUBLIC_ROUTES yet. */
export const PLANNED_SIGNED_IN_HOME_PATH = "/home" as const;
