import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { SiteConfigError } from "@/lib/seo/site-config";
import sitemap, { dynamic } from "./sitemap";

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

describe("sitemap.xml route", () => {
  it("is rendered per request so SITE_URL is read at runtime", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("lists the home page with hreflang alternates on the configured origin", () => {
    const [entry] = sitemap();

    expect(entry.url).toBe("https://example.com/vi");
    expect(entry.alternates?.languages).toEqual({
      en: "https://example.com/en",
      vi: "https://example.com/vi",
      "x-default": "https://example.com/vi",
    });
  });

  it("throws instead of inventing an origin when SITE_URL is missing", () => {
    delete process.env.SITE_URL;

    expect(() => sitemap()).toThrow(SiteConfigError);
  });
});
