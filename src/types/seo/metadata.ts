import type { PUBLIC_ROUTES } from "@/constants/route";
import type { SEO_INDEXABLE_PUBLIC_ROUTE_KEYS } from "@/constants/seo/routes";

export type SeoRobotsMode = "indexable" | "noindex" | "privateApp";

export type SeoImage = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
};

export type SeoPageInput = {
  /** Locale code from next-intl routing (e.g. en / vi). */
  locale: string;
  /** App-router pathname without locale prefix (e.g. "/" or "/become-instructor"). */
  pathname: string;
  title: string;
  description: string;
  robots?: SeoRobotsMode;
  image?: SeoImage;
  /** Absolute or site-relative path already resolved by caller; optional override. */
  canonicalPath?: string;
  type?: "website" | "article";
};

export type SeoSiteConfig = {
  siteUrl: string;
  siteName: string;
  /** Present only when a real asset was supplied — never a missing placeholder path. */
  defaultOgImage?: SeoImage;
  themeColor: string;
  twitterSite?: string;
};

export type ResolveSiteConfigInput = {
  /** Explicit origin; preferred over env when provided. */
  siteUrl?: string;
  siteName?: string;
  /** Optional real OG asset — never invent a missing public file. */
  defaultOgImage?: SeoImage;
  themeColor?: string;
  twitterSite?: string;
  /**
   * When true, read `process.env.SITE_URL` if `siteUrl` is omitted.
   * Never reads NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_API_URL.
   */
  readEnv?: boolean;
};

export type BuildPageMetadataOptions = {
  site?: ResolveSiteConfigInput;
};

export type CanonicalInput = {
  locale: string;
  /** Locale-less app pathname, e.g. "/" or "/become-instructor". */
  pathname?: string;
  query?: Record<string, string>;
  site?: ResolveSiteConfigInput;
};

export type SitemapEntry = {
  url: string;
  lastModified?: Date | string;
  changeFrequency?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
  alternates?: { languages: Record<string, string> };
};

export type BuildSitemapEntriesInput = {
  locales?: readonly string[];
  /** Defaults to SEO-indexable paths only (`home` today). */
  pathnames?: readonly string[];
  site?: ResolveSiteConfigInput;
  changeFrequency?: SitemapEntry["changeFrequency"];
  priority?: number;
};

export type SeoIndexablePublicRouteKey =
  (typeof SEO_INDEXABLE_PUBLIC_ROUTE_KEYS)[number];

export type PublicRouteValue =
  (typeof PUBLIC_ROUTES)[keyof typeof PUBLIC_ROUTES];
