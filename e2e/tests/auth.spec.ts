import { expect, test } from "@playwright/test";
import {
  FIXTURE_USERS,
  resetFixtures,
  revokeSession,
} from "../support/fixture-client";

test.beforeEach(async () => {
  await resetFixtures();
});

async function login(
  page: import("@playwright/test").Page,
  user: { email: string; password: string },
) {
  await page.getByRole("button", { name: "Login" }).first().click();
  await page.getByPlaceholder("Email Address").fill(user.email);
  await page.getByPlaceholder("Password").fill(user.password);
  await page.getByRole("button", { name: "Login" }).last().click();
}

test.describe("Auth journey", () => {
  test("login grants access to a protected instructor screen", async ({
    page,
  }) => {
    await page.goto("/en/instructor");
    await expect(page.getByText("Oops! We can't find that page")).toHaveCount(
      0,
    );
    await expect(page.getByText("Access denied")).toBeVisible({
      timeout: 15_000,
    });

    await login(page, FIXTURE_USERS.instructor);

    await expect(
      page.getByRole("button", { name: "Open user menu" }),
    ).toBeVisible({
      timeout: 15_000,
    });
  });

  test("logout clears the session and shows the login control again", async ({
    page,
  }) => {
    await page.goto("/en/instructor");
    await login(page, FIXTURE_USERS.instructor);
    await expect(
      page.getByRole("button", { name: "Open user menu" }),
    ).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "Open user menu" }).click();
    await page.getByRole("link", { name: "Logout" }).click();

    await expect(
      page.getByRole("button", { name: "Login" }).first(),
    ).toBeVisible({
      timeout: 15_000,
    });
  });

  test("an expired/revoked session logs the user out on the next check", async ({
    page,
  }) => {
    await page.goto("/en/instructor");
    await login(page, FIXTURE_USERS.instructor);
    await expect(
      page.getByRole("button", { name: "Open user menu" }),
    ).toBeVisible({
      timeout: 15_000,
    });

    const sessionCookie = (await page.context().cookies()).find(
      (c) => c.name === "session_id",
    );
    expect(sessionCookie?.value).toBeTruthy();
    if (sessionCookie) await revokeSession(sessionCookie.value);

    await page.reload();

    await expect(
      page.getByRole("button", { name: "Login" }).first(),
    ).toBeVisible({
      timeout: 15_000,
    });
  });

  test("a user without the required permission sees the forbidden/unauthorized state", async ({
    page,
  }) => {
    await page.goto("/en/instructor");
    await login(page, FIXTURE_USERS.learner);

    await expect(
      page.getByRole("button", { name: "Open user menu" }),
    ).toBeVisible({
      timeout: 15_000,
    });
    // Logged in, but without instructor permissions — dashboard access stays denied.
    await expect(page.getByText("Access denied")).toBeVisible();
  });
});
