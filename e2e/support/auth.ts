import { expect, type Page } from "@playwright/test";
import { FIXTURE_USERS } from "./fixture-client";

/**
 * Logs in through the real login popup as the fixture instructor and waits
 * for the authenticated header to appear. Shared by every spec that needs
 * an authenticated instructor session against the fixture backend.
 */
export async function loginAsInstructor(page: Page): Promise<void> {
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
}
