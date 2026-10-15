import { expect, type Page, test } from "@playwright/test";
import { loginAsAdmin } from "../support/auth";
import { resetFixtures } from "../support/fixture-client";

const TAKEN_SLUG = "taken-slug";
const RECOMMENDED_SLUG = "taken-slug-x7k92ab";

test.beforeEach(async ({ page }) => {
  await resetFixtures();
  await loginAsAdmin(page);
});

async function openList(page: Page, resource: "levels" | "topics") {
  await page.goto(`/en/admin/taxonomy/${resource}`);
  await expect(page.getByRole("button", { name: "Add" })).toBeVisible({
    timeout: 15_000,
  });
}

async function openCreate(page: Page, resource: "levels" | "topics") {
  await openList(page, resource);
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.locator("#name")).toBeVisible();
}

async function openEdit(page: Page, resource: "levels" | "topics") {
  await openList(page, resource);
  await page.getByRole("button", { name: "Edit" }).first().click();
  await expect(page.locator("#slug")).toBeVisible({ timeout: 15_000 });
}

function save(page: Page) {
  return page.getByRole("button", { name: "Save", exact: true });
}

function waitForWrite(page: Page, method: "POST" | "PATCH") {
  return page.waitForRequest(
    (request) =>
      request.method() === method &&
      /\/api\/v1\/taxonomy\/(levels|topics)/.test(request.url()),
  );
}

test.describe("Taxonomy slug on create", () => {
  test("omits a blank slug so the backend generates it", async ({ page }) => {
    await openCreate(page, "levels");
    await page.locator("#name").fill("Intermediate");

    const request = waitForWrite(page, "POST");
    await save(page).click();
    const body = (await request).postDataJSON() as Record<string, unknown>;

    expect(body).not.toHaveProperty("slug");
    await expect(
      page.getByRole("cell", { name: "intermediate", exact: true }),
    ).toBeVisible({
      timeout: 15_000,
    });
  });

  test("filters the slug input as the user types", async ({ page }) => {
    await openCreate(page, "levels");
    await page.locator("#slug").fill("Go Level!");

    await expect(page.locator("#slug")).toHaveValue("o-evel");
  });

  test("accepts the recommended slug after a 409 conflict", async ({
    page,
  }) => {
    await openCreate(page, "levels");
    await page.locator("#name").fill("Advanced");
    await page.locator("#slug").fill(TAKEN_SLUG);
    await save(page).click();

    const confirm = page.getByRole("alertdialog");
    await expect(confirm).toContainText(RECOMMENDED_SLUG);
    await confirm.getByRole("button", { name: "Yes" }).click();

    await expect(
      page.getByRole("cell", { name: RECOMMENDED_SLUG }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("keeps the form open when the recommendation is declined", async ({
    page,
  }) => {
    await openCreate(page, "levels");
    await page.locator("#name").fill("Advanced");
    await page.locator("#slug").fill(TAKEN_SLUG);
    await save(page).click();

    const confirm = page.getByRole("alertdialog");
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button", { name: "No" }).click();

    await expect(confirm).toHaveCount(0);
    await expect(page.locator("#slug")).toHaveValue(TAKEN_SLUG);
  });
});

test.describe("Taxonomy slug on edit", () => {
  test("shows the stored slug and omits it when only the name changes", async ({
    page,
  }) => {
    await openEdit(page, "levels");
    await expect(page.locator("#slug")).toHaveValue("beginner");
    await page.locator("#name").fill("Beginner level");

    const request = waitForWrite(page, "PATCH");
    await save(page).click();
    const body = (await request).postDataJSON() as Record<string, unknown>;

    expect(body).not.toHaveProperty("slug");
    expect(body).toHaveProperty("expected_row_version");
  });

  test("reports a backend-resolved slug", async ({ page }) => {
    await openEdit(page, "levels");
    await page.locator("#slug").fill(TAKEN_SLUG);
    await save(page).click();

    await expect(
      page.getByText(
        `Saved. The slug was already taken, so it was changed to ${RECOMMENDED_SLUG}.`,
      ),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("blocks saving when the slug is cleared", async ({ page }) => {
    await openEdit(page, "levels");
    await page.locator("#slug").fill("");
    await save(page).click();

    await expect(page.getByText("Please enter a slug.").first()).toBeVisible();
  });
});

test.describe("Topic tree node slugs", () => {
  test("does not send the slug of an untouched node", async ({ page }) => {
    await openEdit(page, "topics");
    await page.locator("#name").fill("Backend engineering");

    const request = waitForWrite(page, "PATCH");
    await save(page).click();
    const body = (await request).postDataJSON() as {
      child_topics: Array<Record<string, unknown>>;
    };

    expect(body.child_topics).toHaveLength(1);
    expect(body.child_topics[0]).not.toHaveProperty("slug");
  });

  test("sends an edited node slug", async ({ page }) => {
    await openEdit(page, "topics");
    await page.getByRole("button", { name: "Edit slug" }).click();
    await page.getByRole("textbox", { name: "Sub-topic slug" }).fill("golang");

    const request = waitForWrite(page, "PATCH");
    await save(page).click();
    const body = (await request).postDataJSON() as {
      child_topics: Array<Record<string, unknown>>;
    };

    expect(body.child_topics[0].slug).toBe("golang");
  });

  test("blocks a cleared node slug and marks the node", async ({ page }) => {
    await openEdit(page, "topics");
    await page.getByRole("button", { name: "Edit slug" }).click();
    await page.getByRole("textbox", { name: "Sub-topic slug" }).fill("");
    await save(page).click();

    await expect(
      page.getByRole("textbox", { name: "Sub-topic slug" }),
    ).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Please enter a slug.").first()).toBeVisible();
  });
});
