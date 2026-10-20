import { describe, expect, it } from "@jest/globals";
import { buildPageMetadata } from "./build-page-metadata";
import { robotsPreset } from "./robots-presets";

const SITE = { siteUrl: "https://example.com", nodeEnv: "production" } as const;
const INPUT = {
  locale: "en",
  pathname: "/",
  title: "Title",
  description: "Description",
} as const;

describe("buildPageMetadata", () => {
  it("emits canonical, language alternates with x-default and site name", () => {
    const metadata = buildPageMetadata(INPUT, { site: SITE });

    expect(metadata.alternates?.canonical).toBe("https://example.com/en");
    expect(metadata.alternates?.languages).toEqual({
      en: "https://example.com/en",
      vi: "https://example.com/vi",
      "x-default": "https://example.com/vi",
    });
    expect(String(metadata.metadataBase)).toBe("https://example.com/");
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      url: "https://example.com/en",
      siteName: "MyCourse",
      title: "Title",
      description: "Description",
    });
  });

  it("is indexable by default and honours an explicit robots mode", () => {
    expect(buildPageMetadata(INPUT, { site: SITE }).robots).toEqual(
      robotsPreset("indexable"),
    );
    expect(
      buildPageMetadata({ ...INPUT, robots: "noindex" }, { site: SITE }).robots,
    ).toEqual(robotsPreset("noindex"));
  });

  it("emits no social image when none is configured", () => {
    const metadata = buildPageMetadata(INPUT, { site: SITE });

    expect(metadata.openGraph).not.toHaveProperty("images");
    expect(metadata.twitter).not.toHaveProperty("images");
  });

  it("truncates the title at 60 and the description at 160 code points", () => {
    const metadata = buildPageMetadata(
      { ...INPUT, title: "t".repeat(80), description: "d".repeat(200) },
      { site: SITE },
    );

    expect([...(metadata.title as string)]).toHaveLength(60);
    expect([...(metadata.description as string)]).toHaveLength(160);
  });

  it("uses canonicalPath over pathname when given", () => {
    const metadata = buildPageMetadata(
      { ...INPUT, pathname: "/a", canonicalPath: "/become-instructor" },
      { site: SITE },
    );

    expect(metadata.alternates?.canonical).toBe(
      "https://example.com/en/become-instructor",
    );
  });
});
