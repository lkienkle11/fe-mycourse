import { expect, test } from "@playwright/test";
import { loginAsHomeLearner } from "../support/auth";
import { FIXTURE_USERS, resetFixtures } from "../support/fixture-client";

test.use({ locale: "en-US" });

test.describe("Signed-in redirect from the public homepage", () => {
  test.beforeEach(async () => {
    await resetFixtures();
  });

  test("a guest stays on the public homepage", async ({ page }) => {
    await page.goto("/en");

    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  });

  test("a signed-in learner opening / or a locale root lands on /home", async ({
    page,
  }) => {
    await loginAsHomeLearner(page);

    for (const [path, expected] of [
      ["/en", /\/en\/home$/],
      ["/en/", /\/en\/home$/],
      ["/", /\/en\/home$/],
      ["/vi", /\/vi\/home$/],
    ] as const) {
      await page.goto(path);
      await expect(page).toHaveURL(expected);
    }
    await expect(
      page.getByRole("heading", { level: 1, name: "Học điều mới mỗi ngày." }),
    ).toBeVisible();
  });

  test("other public pages are not redirected for a signed-in learner", async ({
    page,
  }) => {
    await loginAsHomeLearner(page);
    await page.goto("/en/become-instructor");

    await expect(page).toHaveURL(/\/en\/become-instructor$/);
  });

  test("the brand logo leads a signed-in learner to /home and a guest to the public homepage", async ({
    page,
  }) => {
    await loginAsHomeLearner(page);
    await page.goto("/en/home");
    await page.locator('header a[href="/en"]').first().click();
    await expect(page).toHaveURL(/\/en\/home$/);

    await page.goto("/en/logout");
    await expect(page).toHaveURL(/\/en$/, { timeout: 15_000 });
    await page.goto("/en/become-instructor");
    await page.locator('header a[href="/en"]').first().click();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  });

  test("logging in without a return path lands on /home", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("link", { name: "Login" }).first().click();
    await page
      .getByPlaceholder("Email Address")
      .fill(FIXTURE_USERS.homeLearner.email);
    await page
      .getByPlaceholder("Password")
      .fill(FIXTURE_USERS.homeLearner.password);
    await page.getByRole("button", { name: "Login" }).last().click();

    await expect(page).toHaveURL(/\/en\/home$/, { timeout: 15_000 });
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("a guest opening /home is sent to the public homepage", async ({
    page,
  }) => {
    await page.goto("/en/home");

    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByText("Sign in to continue")).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  });
});
