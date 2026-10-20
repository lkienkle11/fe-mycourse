import { expect, test } from "@playwright/test";
import { loginAsHomeLearner } from "../support/auth";
import { resetFixtures } from "../support/fixture-client";

test.describe("Signed-in home", () => {
  test.beforeEach(async () => {
    await resetFixtures();
  });

  test("a guest is sent to the public homepage and sees no home sections", async ({
    page,
  }) => {
    await page.goto("/en/home");
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByText("Sign in to continue")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Trending Course", exact: true }),
    ).toHaveCount(0);
  });

  test("a signed-in learner sees the hero and the three sections", async ({
    page,
  }) => {
    await loginAsHomeLearner(page);
    await page.goto("/en/home");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Learn something new everyday.",
      }),
    ).toBeVisible();
    for (const name of [
      "Complete your Course",
      "Trending Course",
      "Popular Instructor",
    ]) {
      await expect(
        page.getByRole("heading", { name, exact: true }),
      ).toBeVisible();
    }
    await expect(page.getByText("Popular Instructor 1")).toBeVisible();
    await expect(page.getByText("1/20 sub-lessons completed")).toBeVisible();
  });

  test("the hero has no arrow buttons, swipes by dragging and auto-advances every 3 seconds", async ({
    page,
  }) => {
    await loginAsHomeLearner(page);
    await page.goto("/en/home");

    const current = page.locator('button[aria-current="true"]');
    await expect(page.getByRole("button", { name: "Next slide" })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("button", { name: "Previous slide" }),
    ).toHaveCount(0);
    await expect(current).toHaveAccessibleName("Go to slide 1");

    // Manual drag to the left moves to the next slide.
    const carousel = page.getByRole("region", { name: "Featured highlights" });
    const box = await carousel.boundingBox();
    if (!box) throw new Error("carousel has no bounding box");
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.8, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, y, { steps: 12 });
    await page.mouse.up();
    await expect(current).toHaveAccessibleName("Go to slide 2");

    // Without interaction it keeps moving right on its own.
    await expect(current).toHaveAccessibleName("Go to slide 3", {
      timeout: 6000,
    });
  });

  test("on a phone the sections are swipeable rows and the page does not scroll sideways", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsHomeLearner(page);
    await page.goto("/en/home");

    const trending = page.locator("section", {
      has: page.getByRole("heading", { name: "Trending Course", exact: true }),
    });
    await expect(trending.getByText("Trending Course 8")).toBeAttached();
    const row = trending.locator("> div").first();

    await expect(row).toHaveCSS("display", "flex");
    await expect(row).toHaveCSS("scroll-snap-type", "x mandatory");
    const metrics = await row.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);
    await row.evaluate((el) => el.scrollTo({ left: el.scrollWidth }));
    await expect
      .poll(() => row.evaluate((el) => el.scrollLeft))
      .toBeGreaterThan(0);
    const pageOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(pageOverflow).toBeLessThanOrEqual(0);
  });

  test("from the sm breakpoint up the sections keep their grids", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loginAsHomeLearner(page);
    await page.goto("/en/home");

    const trending = page.locator("section", {
      has: page.getByRole("heading", { name: "Trending Course", exact: true }),
    });
    await expect(trending.getByText("Trending Course 8")).toBeAttached();
    const row = trending.locator("> div").first();

    await expect(row).toHaveCSS("display", "grid");
    await expect(row).toHaveCSS("grid-template-columns", /^(\S+ ){3}\S+$/);
  });

  test("Expand More on Trending requests the maximum limit once and then disappears", async ({
    page,
  }) => {
    await loginAsHomeLearner(page);
    const trendingRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/v1/catalog/courses/trending")) {
        trendingRequests.push(request.url());
      }
    });
    await page.goto("/en/home");

    const trending = page.locator("section", {
      has: page.getByRole("heading", { name: "Trending Course", exact: true }),
    });
    await expect(trending.getByText("Trending Course 8")).toBeVisible();
    await expect(trending.getByText("Trending Course 9")).toHaveCount(0);

    await trending.getByRole("button", { name: "Expand More" }).click();
    await expect(trending.getByText("Trending Course 24")).toBeVisible();
    await expect(
      trending.getByRole("button", { name: "Expand More" }),
    ).toHaveCount(0);
    expect(trendingRequests.some((url) => url.includes("limit=24"))).toBe(true);
  });

  test("a trending card opens the temporary course page", async ({ page }) => {
    await loginAsHomeLearner(page);
    await page.goto("/en/home");

    await page.getByRole("link", { name: /Trending Course 1\b/ }).click();
    await expect(page).toHaveURL(/\/en\/courses\/trending-course-1$/);
    await expect(
      page.getByRole("heading", { name: "Course page coming soon" }),
    ).toBeVisible();
  });
});
