import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { isValidElement, type ReactNode } from "react";
import { JsonLd } from "@/lib/seo/json-ld";
import enMessages from "@/messages/en";
import viMessages from "@/messages/vi";
import LocalePage from "./page";

/**
 * `generateMetadata` depends on `next-intl/server`, which only runs in a real
 * request scope; its head tags are asserted end to end in `e2e/tests/seo.spec.ts`.
 * The factory it calls is covered by `lib/seo/build-page-metadata.test.ts`.
 */
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

function childElements(node: ReactNode) {
  const children = (node as { props: { children: ReactNode[] } }).props
    .children;
  return children.filter(isValidElement);
}

describe("public home page copy", () => {
  it.each([
    ["en", enMessages],
    ["vi", viMessages],
  ])("keeps the %s title and description within the SEO limits", (_, messages) => {
    expect(messages.homepage.seo.title).not.toBe("");
    expect([...messages.homepage.seo.title].length).toBeLessThanOrEqual(60);
    expect(messages.homepage.seo.description).not.toBe("");
    expect([...messages.homepage.seo.description].length).toBeLessThanOrEqual(
      160,
    );
  });

  it("does not use the starter placeholder text", () => {
    const text = JSON.stringify([
      enMessages.homepage.seo,
      viMessages.homepage.seo,
    ]);

    expect(text).not.toMatch(/MyCourse FE|Next\.js 16 starter/);
  });
});

describe("public home page structured data", () => {
  it("passes an Organization with only the site name and origin", () => {
    const [jsonLd] = childElements(LocalePage());

    expect(jsonLd.type).toBe(JsonLd);
    expect((jsonLd.props as { data: unknown }).data).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "MyCourse",
      url: "https://example.com",
    });
  });
});
