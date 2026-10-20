/**
 * robots.txt rules for `src/app/robots.ts`: localized public allow-list,
 * localized private disallow-list, and the absolute sitemap URL.
 */

import type { MetadataRoute } from "next";
import {
  privateCrawlDisallowPaths,
  publicCrawlAllowPaths,
} from "@/lib/security/web/crawl-policy";
import { localizedPathname, toAbsoluteUrl } from "@/lib/seo/canonical";
import { resolveSiteConfig, siteLocales } from "@/lib/seo/site-config";
import type { BuildRobotsTxtRulesInput } from "@/types/seo/metadata";

export function buildRobotsTxtRules(
  input: BuildRobotsTxtRulesInput = {},
): MetadataRoute.Robots {
  const site = resolveSiteConfig(input.site ?? { readEnv: true });
  const locales = input.locales ?? siteLocales();
  const localized = (paths: readonly string[]): string[] =>
    locales.flatMap((locale) =>
      paths.map((path) => localizedPathname(locale, path)),
    );

  return {
    rules: {
      userAgent: "*",
      allow: localized(publicCrawlAllowPaths()),
      disallow: localized(privateCrawlDisallowPaths()),
    },
    sitemap: toAbsoluteUrl(site.siteUrl, "/sitemap.xml"),
  };
}
