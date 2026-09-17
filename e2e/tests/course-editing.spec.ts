import { expect, test } from "@playwright/test";
import { FIXTURE_USERS, resetFixtures } from "../support/fixture-client";

const COURSE_ID = "course-fixture-1";

test.beforeEach(async ({ page }) => {
  await resetFixtures();
  await page.goto("/en/instructor");
  await page.getByRole("button", { name: "Login" }).first().click();
  await page
    .getByPlaceholder("Email Address")
    .fill(FIXTURE_USERS.instructor.email);
  await page
    .getByPlaceholder("Password")
    .fill(FIXTURE_USERS.instructor.password);
  await page.getByRole("button", { name: "Login" }).last().click();
  await expect(
    page.getByRole("button", { name: "Open user menu" }),
  ).toBeVisible({
    timeout: 15_000,
  });
});

test.describe("Course collaborator journey", () => {
  test("adds a collaborator through the real picker UI and shows it in the list", async ({
    page,
  }) => {
    await page.goto(`/en/instructor/courses/${COURSE_ID}/collaborators`);

    await expect(page.getByText("No collaborators found.")).toHaveCount(0);
    await expect(page.getByText("Fixture Instructor")).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "Add editor" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page
      .getByRole("checkbox", { name: /Candidate Collaborator/i })
      .click();
    await page.getByRole("button", { name: "Add selected" }).click();

    await expect(page.getByText("Candidate Collaborator")).toBeVisible({
      timeout: 15_000,
    });
  });
});

test.describe("Course outline reorder", () => {
  /**
   * `SortableList` (`src/components/shared/sortable-list.tsx`) is built on
   * `@dnd-kit`, whose keyboard sensor is a first-class activation path (not a
   * synthetic fallback): focusing the drag handle and pressing Space picks up
   * the row, ArrowDown/ArrowUp moves it among siblings, and Space drops it.
   * That is what this test drives, since it is far more reliable across
   * browsers than simulating the pointer-sensor's multi-step drag gesture,
   * and it exercises the exact same `onDragEnd` → lease → persist → merge
   * path (`src/hooks/course/use-course-outline-reorder.ts`) a pointer drag
   * would.
   */
  test("reorders sections with the keyboard and persists the new order", async ({
    page,
  }) => {
    await page.goto(`/en/instructor/courses/${COURSE_ID}/outline`);

    // The drag-handle button is a direct child of the SortableRow wrapper
    // (`src/components/shared/sortable-list.tsx`), so `:has(> button...)`
    // selects exactly the two reorderable section rows, not the section
    // card's own inner wrapper (which shares no such direct-child relation).
    const rows = page.locator(
      'div:has(> button[aria-label="Reorder section"])',
    );
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toContainText("Alpha Section", {
      timeout: 15_000,
    });
    await expect(rows.last()).toContainText("Beta Section");

    // dnd-kit's `KeyboardSensor` defers attaching its own keydown listener
    // by one tick after pickup (see `attach()` in
    // `node_modules/@dnd-kit/core/dist/core.cjs.development.js`), so an
    // arrow-key press sent immediately after the activating Space is lost.
    // A short wait after pickup (before the move key) is required; the
    // subsequent `toContainText` poll then just waits out React's render.
    await rows.first().getByRole("button", { name: "Reorder section" }).focus();
    await page.keyboard.press("Space");
    await page.waitForTimeout(100);
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("status")).toContainText(
      "moved over droppable area section-2",
      { timeout: 5_000 },
    );
    await page.keyboard.press("Space");

    await expect(page.getByText("Section order saved.")).toBeVisible({
      timeout: 15_000,
    });
    await expect(rows.first()).toContainText("Beta Section");
    await expect(rows.last()).toContainText("Alpha Section");

    await page.reload();
    const rowsAfterReload = page.locator(
      'div:has(> button[aria-label="Reorder section"])',
    );
    await expect(rowsAfterReload.first()).toContainText("Beta Section", {
      timeout: 15_000,
    });
  });
});
