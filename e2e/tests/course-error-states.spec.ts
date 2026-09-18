import { expect, test } from "@playwright/test";
import { loginAsInstructor } from "../support/auth";
import { resetFixtures } from "../support/fixture-client";

test.beforeEach(async ({ page }) => {
  await resetFixtures();
  await loginAsInstructor(page);
});

test.describe("Course editor status-aware error states", () => {
  test("renders the forbidden StatusErrorPage variant instead of the generic fallback", async ({
    page,
  }) => {
    await page.goto(
      "/en/instructor/courses/course-fixture-forbidden/collaborators",
    );

    await expect(
      page.getByRole("heading", { name: "Access denied" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText("You do not have permission to view this content."),
    ).toBeVisible();

    await page.getByRole("link", { name: "Back to courses" }).click();
    await expect(page).toHaveURL(/\/en\/instructor\/courses\/?$/);
  });
});
