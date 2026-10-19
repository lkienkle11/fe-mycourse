import { expect, type Page } from "@playwright/test";
import { FIXTURE_USERS } from "./fixture-client";

type FixtureCredentials = (typeof FIXTURE_USERS)[keyof typeof FIXTURE_USERS];

/**
 * Logs in through the real login popup as a fixture account and waits for the
 * authenticated header to appear. Shared by every spec that needs an
 * authenticated session against the fixture backend.
 */
async function loginAs(
  page: Page,
  credentials: FixtureCredentials,
): Promise<void> {
  await page.goto("/en/instructor");
  await page.getByRole("button", { name: "Login" }).first().click();
  await page.getByPlaceholder("Email Address").fill(credentials.email);
  await page.getByPlaceholder("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Login" }).last().click();
  await expect(
    page.getByRole("button", { name: "Open user menu" }),
  ).toBeVisible({
    timeout: 15_000,
  });
}

export function loginAsInstructor(page: Page): Promise<void> {
  return loginAs(page, FIXTURE_USERS.instructor);
}

export function loginAsAdmin(page: Page): Promise<void> {
  return loginAs(page, FIXTURE_USERS.admin);
}

export function loginAsHomeLearner(page: Page): Promise<void> {
  return loginAs(page, FIXTURE_USERS.homeLearner);
}
