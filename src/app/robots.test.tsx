import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { SiteConfigError } from "@/lib/seo/site-config";
import robots, { dynamic } from "./robots";

const original = process.env.SITE_URL;

beforeEach(() => {
  jest.replaceProperty(process.env, "NODE_ENV", "production");
  process.env.SITE_URL = "https://example.com";
});

afterEach(() => {
  jest.restoreAllMocks();
  if (original === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = original;
});

describe("robots.txt route", () => {
  it("is rendered per request so SITE_URL is read at runtime", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("declares the sitemap on the configured origin and blocks private areas", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;

    expect(result.sitemap).toBe("https://example.com/sitemap.xml");
    expect(rules.disallow).toEqual(expect.arrayContaining(["/en/admin"]));
  });

  it("throws instead of inventing an origin when SITE_URL is missing", () => {
    delete process.env.SITE_URL;

    expect(() => robots()).toThrow(SiteConfigError);
  });
});
