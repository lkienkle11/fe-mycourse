import { expect, test } from "@playwright/test";
import { loginAsInstructor } from "../support/auth";
import { resetFixtures } from "../support/fixture-client";

const COURSE_ID = "course-fixture-1";
const TAKEN_SLUG = "taken-slug";
const RECOMMENDED_SLUG = "taken-slug-x7k92ab";

test.beforeEach(async ({ page }) => {
  await resetFixtures();
  await loginAsInstructor(page);
});

async function openCreateDialog(page: import("@playwright/test").Page) {
  await page.goto("/en/instructor/courses");
  await page.getByRole("button", { name: "New course" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

test.describe("Course slug on create", () => {
  test("creates a course with a blank slug and opens the editor", async ({
    page,
  }) => {
    await openCreateDialog(page);
    await page.locator("#course-title").fill("Golang course");
    await page.getByRole("button", { name: "Create", exact: true }).click();

    await expect(page).toHaveURL(
      new RegExp(`/instructor/courses/${COURSE_ID}/info`),
      { timeout: 15_000 },
    );
  });

  test("filters the slug input as the user types", async ({ page }) => {
    await openCreateDialog(page);
    await page.locator("#course-slug").fill("Go Course!");

    await expect(page.locator("#course-slug")).toHaveValue("o-ourse");
  });

  test("offers the recommended slug on conflict and accepts it", async ({
    page,
  }) => {
    await openCreateDialog(page);
    await page.locator("#course-title").fill("Golang course");
    await page.locator("#course-slug").fill(TAKEN_SLUG);
    await page.getByRole("button", { name: "Create", exact: true }).click();

    const confirm = page.getByRole("alertdialog");
    await expect(confirm).toContainText(RECOMMENDED_SLUG);
    await confirm.getByRole("button", { name: "Yes" }).click();

    await expect(page).toHaveURL(
      new RegExp(`/instructor/courses/${COURSE_ID}/info`),
      { timeout: 15_000 },
    );
  });

  test("returns to the form when the recommendation is declined", async ({
    page,
  }) => {
    await openCreateDialog(page);
    await page.locator("#course-title").fill("Golang course");
    await page.locator("#course-slug").fill(TAKEN_SLUG);
    await page.getByRole("button", { name: "Create", exact: true }).click();

    const confirm = page.getByRole("alertdialog");
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button", { name: "No" }).click();

    await expect(confirm).toHaveCount(0);
    await expect(page.locator("#course-slug")).toHaveValue(TAKEN_SLUG);
    await expect(page).toHaveURL(/\/instructor\/courses$/);
  });
});

test.describe("Course slug on basic info", () => {
  test("shows the current slug and reports a backend-resolved slug", async ({
    page,
  }) => {
    await page.goto(`/en/instructor/courses/${COURSE_ID}/info`);
    const slugInput = page.locator("#course-basic-slug");
    await expect(slugInput).toHaveValue("fixture-course", { timeout: 15_000 });

    await slugInput.fill(TAKEN_SLUG);
    await page.getByRole("button", { name: "Save basic info" }).click();

    await expect(
      page.getByText(
        `Course information saved. The slug was already taken, so it was changed to ${RECOMMENDED_SLUG}.`,
      ),
    ).toBeVisible({ timeout: 15_000 });
    await expect(slugInput).toHaveValue(RECOMMENDED_SLUG);
  });

  test("omits an unchanged slug from the request and shows the normal success toast", async ({
    page,
  }) => {
    await page.goto(`/en/instructor/courses/${COURSE_ID}/info`);
    await expect(page.locator("#course-basic-slug")).toHaveValue(
      "fixture-course",
      { timeout: 15_000 },
    );

    const requestPromise = page.waitForRequest(
      (request) =>
        request.method() === "PATCH" &&
        request.url().includes(`/courses/${COURSE_ID}/basic-info`),
    );
    await page.getByRole("button", { name: "Save basic info" }).click();
    const body = (await requestPromise).postDataJSON() as Record<
      string,
      unknown
    >;

    expect(body).not.toHaveProperty("slug");
    await expect(page.getByText("Course information saved.")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("blocks saving when the slug is cleared", async ({ page }) => {
    await page.goto(`/en/instructor/courses/${COURSE_ID}/info`);
    const slugInput = page.locator("#course-basic-slug");
    await expect(slugInput).toHaveValue("fixture-course", { timeout: 15_000 });

    await slugInput.fill("");
    await page.getByRole("button", { name: "Save basic info" }).click();

    await expect(page.getByText("Please enter a slug.").first()).toBeVisible();
  });
});
