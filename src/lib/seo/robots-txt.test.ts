import { describe, expect, it } from "@jest/globals";
import { buildRobotsTxtRules } from "./robots-txt";
import { SiteConfigError } from "./site-config";

const SITE = { siteUrl: "https://example.com", nodeEnv: "production" } as const;

describe("buildRobotsTxtRules", () => {
  it("allows the localized public roots and declares the sitemap", () => {
    const robots = buildRobotsTxtRules({ site: SITE });

    expect(robots.sitemap).toBe("https://example.com/sitemap.xml");
    expect(robots.rules).toMatchObject({
      userAgent: "*",
      allow: ["/en", "/vi"],
    });
  });

  it("disallows every private prefix for every locale and nothing unlocalised", () => {
    const rules = buildRobotsTxtRules({ site: SITE }).rules;
    const disallow = (Array.isArray(rules) ? rules[0] : rules)
      .disallow as string[];

    expect(disallow).toEqual(
      expect.arrayContaining([
        "/en/admin",
        "/vi/admin",
        "/en/home",
        "/vi/home",
        "/en/instructor",
        "/vi/sysadmin",
      ]),
    );
    expect(disallow.every((path) => /^\/(en|vi)\//.test(path))).toBe(true);
  });

  it("restricts to the given locales", () => {
    const rules = buildRobotsTxtRules({ site: SITE, locales: ["vi"] }).rules;
    const group = Array.isArray(rules) ? rules[0] : rules;

    expect(group.allow).toEqual(["/vi"]);
  });

  it("throws for an invalid site origin instead of guessing one", () => {
    expect(() =>
      buildRobotsTxtRules({
        site: { siteUrl: "http://example.com", nodeEnv: "production" },
      }),
    ).toThrow(SiteConfigError);
  });
});
