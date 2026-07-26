/**
 * Factory: SeoPageInput → Next.js Metadata (OG + Twitter + robots + alternates).
 * Emits social images only when a real SeoImage is provided.
 */

import type { Metadata } from "next";
import {
  SEO_DESCRIPTION_MAX_CODE_POINTS,
  SEO_TITLE_MAX_CODE_POINTS,
} from "@/constants/seo/metadata";
import { buildCanonicalUrl, toAbsoluteUrl } from "@/lib/seo/canonical";
import { robotsPreset } from "@/lib/seo/robots-presets";
import { resolveSiteConfig, siteLocales } from "@/lib/seo/site-config";
import { truncateUnicodeCodePoints } from "@/lib/utils/unicode-length";
import type {
  BuildPageMetadataOptions,
  SeoImage,
  SeoPageInput,
} from "@/types/seo/metadata";

function resolveSeoImage(
  input: SeoPageInput,
  siteDefault: SeoImage | undefined,
): SeoImage | undefined {
  return input.image ?? siteDefault;
}

export function buildPageMetadata(
  input: SeoPageInput,
  options: BuildPageMetadataOptions = {},
): Metadata {
  const site = resolveSiteConfig(options.site ?? { readEnv: true });
  const title = truncateUnicodeCodePoints(
    input.title.trim(),
    SEO_TITLE_MAX_CODE_POINTS,
  );
  const description = truncateUnicodeCodePoints(
    input.description.trim(),
    SEO_DESCRIPTION_MAX_CODE_POINTS,
  );
  const pathname = input.canonicalPath ?? input.pathname;
  const siteOpts = options.site ?? { readEnv: true };
  const canonical = buildCanonicalUrl({
    locale: input.locale,
    pathname,
    site: siteOpts,
  });

  const image = resolveSeoImage(input, site.defaultOgImage);
  const imageUrl = image ? toAbsoluteUrl(site.siteUrl, image.url) : undefined;

  const languages: Record<string, string> = {};
  for (const locale of siteLocales()) {
    languages[locale] = buildCanonicalUrl({
      locale,
      pathname,
      site: siteOpts,
    });
  }

  const ogType = input.type ?? "website";
  const robots = robotsPreset(input.robots ?? "indexable");

  const openGraph: NonNullable<Metadata["openGraph"]> = {
    type: ogType,
    locale: input.locale,
    url: canonical,
    siteName: site.siteName,
    title,
    description,
  };
  if (image && imageUrl) {
    openGraph.images = [
      {
        url: imageUrl,
        width: image.width,
        height: image.height,
        alt: image.alt,
      },
    ];
  }

  const twitter: NonNullable<Metadata["twitter"]> = {
    card: imageUrl ? "summary_large_image" : "summary",
    title,
    description,
    site: site.twitterSite,
  };
  if (imageUrl) {
    twitter.images = [imageUrl];
  }

  return {
    metadataBase: new URL(site.siteUrl),
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    robots,
    openGraph,
    twitter,
    other: {
      "theme-color": site.themeColor,
    },
  };
}
