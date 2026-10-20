import { describe, expect, it } from "@jest/globals";
import {
  buildSitemapEntries,
  listPublicStaticPathnames,
} from "./sitemap-builder";

const SITE = { siteUrl: "https://example.com", nodeEnv: "production" } as const;

describe("buildSitemapEntries", () => {
  it("lists only the indexable home with default-locale url and alternates", () => {
    expect(buildSitemapEntries({ site: SITE })).toEqual([
      {
        url: "https://example.com/vi",
        changeFrequency: "weekly",
        priority: 1,
        alternates: {
          languages: {
            en: "https://example.com/en",
            vi: "https://example.com/vi",
            "x-default": "https://example.com/vi",
          },
        },
      },
    ]);
  });

  it("gives other pathnames a lower priority and honours locales", () => {
    const [entry] = buildSitemapEntries({
      site: SITE,
      pathnames: ["/become-instructor"],
      locales: ["en"],
    });

    expect(entry.url).toBe("https://example.com/vi/become-instructor");
    expect(entry.priority).toBe(0.7);
    expect(Object.keys(entry.alternates?.languages ?? {})).toEqual([
      "en",
      "x-default",
    ]);
  });
});

describe("listPublicStaticPathnames", () => {
  it("still lists every public route including auth flows", () => {
    expect(listPublicStaticPathnames()).toEqual(
      expect.arrayContaining(["/", "/login", "/signup"]),
    );
  });
});
