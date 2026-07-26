export { buildPageMetadata } from "@/lib/seo/build-page-metadata";
export {
  buildCanonicalUrl,
  localizedPathname,
  toAbsoluteUrl,
} from "@/lib/seo/canonical";
export {
  isSeoIndexablePublicRouteKey,
  listSeoIndexablePathnames,
  SEO_INDEXABLE_PUBLIC_ROUTE_KEYS,
} from "@/lib/seo/indexable-routes";
export { JsonLd } from "@/lib/seo/json-ld";
export * from "@/lib/seo/ranking";
export {
  robotsModeForPublicRouteKey,
  robotsPreset,
} from "@/lib/seo/robots-presets";
export {
  parseAbsoluteHttpsOrigin,
  parseAbsoluteHttpsUrl,
  resolveSiteConfig,
  SiteConfigError,
  siteDefaultLocale,
  siteLocales,
} from "@/lib/seo/site-config";
export {
  buildSitemapEntries,
  listPrivatePathPrefixes,
  listPublicStaticPathnames,
} from "@/lib/seo/sitemap-builder";
export type * from "@/types/seo";
