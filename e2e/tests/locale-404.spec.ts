import { expect, test } from "@playwright/test";

test.describe("Locale and 404 behavior", () => {
  test("a valid locale renders real page content without an unhandled rendering error", async ({
    page,
  }) => {
    const response = await page.goto("/en");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("an unknown route under a valid locale shows the 404 page with recovery navigation", async ({
    page,
  }) => {
    const response = await page.goto("/en/this-route-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("Oops! We can't find that page")).toBeVisible();

    const backHome = page.getByRole("link", { name: "Back to homepage" });
    await expect(backHome).toBeVisible();
    await backHome.click();
    await expect(page).toHaveURL(/\/en\/?$/);
  });

  test("an unsupported locale segment does not render as valid content or crash", async ({
    page,
  }) => {
    const response = await page.goto("/xx");
    expect(response?.status()).toBeGreaterThanOrEqual(400);
    await expect(page.locator("body")).not.toContainText("Application error");
  });
});
