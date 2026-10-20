import { afterEach, describe, expect, it } from "@jest/globals";
import {
  parseAbsoluteHttpsOrigin,
  parseAbsoluteHttpsUrl,
  resolveSiteConfig,
  SiteConfigError,
} from "./site-config";

const PRODUCTION = { nodeEnv: "production" } as const;
const DEVELOPMENT = { nodeEnv: "development" } as const;

describe("resolveSiteConfig in production", () => {
  it.each([
    ["https://example.com", "https://example.com"],
    ["https://example.com/", "https://example.com"],
    ["https://example.com:8443", "https://example.com:8443"],
  ])("accepts %s", (siteUrl, expected) => {
    expect(resolveSiteConfig({ siteUrl, ...PRODUCTION }).siteUrl).toBe(
      expected,
    );
  });

  it.each([
    "http://example.com",
    "http://localhost:3000",
    "https://localhost",
    "https://127.0.0.1",
    "https://[::1]",
    "https://LOCALHOST.",
    "https://example.com/vi",
    "https://example.com?x=1",
    "https://example.com#top",
    "https://user:pw@example.com",
    "ftp://example.com",
    "",
  ])("rejects %j", (siteUrl) => {
    expect(() => resolveSiteConfig({ siteUrl, ...PRODUCTION })).toThrow(
      SiteConfigError,
    );
  });

  it("explains the production contract in the error message", () => {
    expect(() => resolveSiteConfig({ siteUrl: "", ...PRODUCTION })).toThrow(
      /public https:\/\/ origin in production/,
    );
  });
});

describe("resolveSiteConfig outside production", () => {
  it.each([
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://example.com",
  ])("accepts %s", (siteUrl) => {
    expect(() => resolveSiteConfig({ siteUrl, ...DEVELOPMENT })).not.toThrow();
  });

  it.each([
    "http://example.com",
    "http://[::1]:3000",
    "ftp://example.com",
    "http://localhost/vi",
    "http://localhost?x=1",
    "http://user:pw@localhost",
    "",
  ])("rejects %j", (siteUrl) => {
    expect(() => resolveSiteConfig({ siteUrl, ...DEVELOPMENT })).toThrow(
      SiteConfigError,
    );
  });

  it("keeps the origin of an allowed http localhost value", () => {
    expect(
      resolveSiteConfig({ siteUrl: "http://localhost:3000", ...DEVELOPMENT })
        .siteUrl,
    ).toBe("http://localhost:3000");
  });
});

describe("resolveSiteConfig environment source", () => {
  const original = process.env.SITE_URL;

  afterEach(() => {
    if (original === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = original;
  });

  it("reads SITE_URL only when readEnv is true", () => {
    process.env.SITE_URL = "https://example.com";
    expect(resolveSiteConfig({ readEnv: true, ...PRODUCTION }).siteUrl).toBe(
      "https://example.com",
    );
    expect(() => resolveSiteConfig(PRODUCTION)).toThrow(SiteConfigError);
  });

  it("prefers an explicit siteUrl over the environment", () => {
    process.env.SITE_URL = "https://env.example.com";
    expect(
      resolveSiteConfig({
        siteUrl: "https://explicit.example.com",
        readEnv: true,
        ...PRODUCTION,
      }).siteUrl,
    ).toBe("https://explicit.example.com");
  });

  it("throws when SITE_URL is unset", () => {
    delete process.env.SITE_URL;
    expect(() => resolveSiteConfig({ readEnv: true, ...PRODUCTION })).toThrow(
      SiteConfigError,
    );
  });
});

describe("parseAbsoluteHttpsOrigin", () => {
  it("keeps the one-argument behaviour: https on any host", () => {
    expect(parseAbsoluteHttpsOrigin("https://localhost")).not.toBeNull();
    expect(parseAbsoluteHttpsOrigin("http://localhost")).toBeNull();
  });

  it("is the same function as parseAbsoluteHttpsUrl", () => {
    expect(parseAbsoluteHttpsUrl).toBe(parseAbsoluteHttpsOrigin);
  });
});
