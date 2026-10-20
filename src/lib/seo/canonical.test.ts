import { describe, expect, it } from "@jest/globals";
import {
  buildCanonicalUrl,
  buildLanguageAlternates,
  localizedPathname,
} from "./canonical";

const SITE = { siteUrl: "https://example.com", nodeEnv: "production" } as const;

describe("localizedPathname", () => {
  it("prefixes the locale and drops the lone root slash", () => {
    expect(localizedPathname("vi", "/")).toBe("/vi");
    expect(localizedPathname("en", "/home")).toBe("/en/home");
  });
});

describe("buildCanonicalUrl", () => {
  it("joins the site origin and the localized path", () => {
    expect(buildCanonicalUrl({ locale: "en", site: SITE })).toBe(
      "https://example.com/en",
    );
  });
});

describe("buildLanguageAlternates", () => {
  it("maps every locale and x-default to the default locale", () => {
    expect(buildLanguageAlternates({ pathname: "/", site: SITE })).toEqual({
      en: "https://example.com/en",
      vi: "https://example.com/vi",
      "x-default": "https://example.com/vi",
    });
  });

  it("restricts the map to the given locales but keeps x-default", () => {
    expect(
      buildLanguageAlternates({ pathname: "/", locales: ["en"], site: SITE }),
    ).toEqual({
      en: "https://example.com/en",
      "x-default": "https://example.com/vi",
    });
  });
});
