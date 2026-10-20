import { expect, test } from "@playwright/test";
import { loginAsHomeLearner } from "../support/auth";
import { resetFixtures } from "../support/fixture-client";

const ORIGIN = "https://e2e.example.test";

test.describe("Public homepage SEO", () => {
  test("/en exposes localized metadata, canonical, hreflang and social tags", async ({
    page,
  }) => {
    await page.goto("/en");

    await expect(page).toHaveTitle(
      "MyCourse - Learn online from industry experts",
    );
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /industry experts/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${ORIGIN}/en`,
    );
    for (const [hreflang, path] of [
      ["vi", "/vi"],
      ["en", "/en"],
      ["x-default", "/vi"],
    ]) {
      await expect(
        page.locator(`link[rel="alternate"][hreflang="${hreflang}"]`),
      ).toHaveAttribute("href", `${ORIGIN}${path}`);
    }
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      `${ORIGIN}/en`,
    );
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
      "content",
      "MyCourse",
    );
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      "content",
      "website",
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /^index, follow/,
    );
  });

  test("/en carries exactly one Organization JSON-LD block", async ({
    page,
  }) => {
    await page.goto("/en");

    const scripts = page.locator('script[type="application/ld+json"]');
    await expect(scripts).toHaveCount(1);
    expect(JSON.parse((await scripts.first().textContent()) ?? "")).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "MyCourse",
      url: ORIGIN,
    });
  });

  test("/vi is Vietnamese", async ({ page }) => {
    await page.goto("/vi");

    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    await expect(page).toHaveTitle("MyCourse - Học trực tuyến cùng chuyên gia");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${ORIGIN}/vi`,
    );
  });

  test("the signed-in home is noindex, nofollow and has no public SEO tags", async ({
    page,
  }) => {
    await resetFixtures();
    await loginAsHomeLearner(page);
    await page.goto("/en/home");

    await expect(page).toHaveTitle("Home");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex, nofollow/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(0);
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(
      0,
    );
  });
});

test.describe("Crawl discovery", () => {
  test("/robots.txt blocks private areas per locale and declares the sitemap", async ({
    request,
  }) => {
    const response = await request.get("/robots.txt");
    const body = await response.text();

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/plain");
    for (const line of [
      "Allow: /en",
      "Allow: /vi",
      "Disallow: /en/admin",
      "Disallow: /vi/admin",
      "Disallow: /en/home",
      "Disallow: /vi/home",
      `Sitemap: ${ORIGIN}/sitemap.xml`,
    ]) {
      expect(body).toContain(line);
    }
  });

  test("/sitemap.xml lists only the home with language alternates", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    const body = await response.text();

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("xml");
    expect(body).toContain(`<loc>${ORIGIN}/vi</loc>`);
    expect(body).toContain(`hreflang="x-default" href="${ORIGIN}/vi"`);
    expect(body).toContain(`hreflang="en" href="${ORIGIN}/en"`);
    expect(body).not.toMatch(/\/(login|signup|home|admin|instructor)</);
  });
});
