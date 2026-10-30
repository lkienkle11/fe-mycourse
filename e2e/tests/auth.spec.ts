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
    // Not authenticated yet — dashboard gate shows the `unauthorized` variant.
    await expect(page.getByText("Sign in required")).toBeVisible({
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

    // Header CTA is a route link (`/login?next=...`), not a modal-opening
    // button — the route-based login/signup modal reads `next` from the URL.
    await expect(page.getByRole("link", { name: "Login" }).first()).toBeVisible(
      {
        timeout: 15_000,
      },
    );
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

  test("a revoked session leaves the public home reachable", async ({
    page,
  }) => {
    await page.goto("/en/instructor");
    await login(page, FIXTURE_USERS.learner);
    await expect(
      page.getByRole("button", { name: "Open user menu" }),
    ).toBeVisible({
      timeout: 15_000,
    });

    const sessionCookie = (await page.context().cookies()).find(
      (cookie) => cookie.name === "session_id",
    );
    expect(sessionCookie?.value).toBeTruthy();
    if (sessionCookie) await revokeSession(sessionCookie.value);

    await page.goto("/en/home");
    await expect(page.getByText("Sign in to continue")).toBeVisible({
      timeout: 15_000,
    });
    await expect
      .poll(
        async () =>
          (await page.context().cookies()).filter((cookie) =>
            ["refresh_token", "session_id"].includes(cookie.name),
          ).length,
        { timeout: 15_000 },
      )
      .toBe(0);

    await page.goto("/en");
    await expect(page).toHaveURL(/\/en$/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Unlock Your Potential with Our Diverse Courses",
      }),
    ).toBeVisible();
  });

  test("a backend failure on /me keeps the session and shows a retryable state", async ({
    page,
  }) => {
    await page.goto("/en/instructor");
    await login(page, FIXTURE_USERS.learner);
    await expect(
      page.getByRole("button", { name: "Open user menu" }),
    ).toBeVisible({
      timeout: 15_000,
    });

    // A new tab has an empty sessionStorage, so no cached `/me` hides the failure.
    const freshTab = await page.context().newPage();
    let failMe = true;
    await freshTab.route("**/api/v1/me", (route) =>
      failMe
        ? route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ code: 9999, message: "x", data: null }),
          })
        : route.continue(),
    );

    await freshTab.goto("/en/home");
    await expect(
      freshTab.getByRole("heading", { name: "Server error" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(freshTab.getByText("Sign in to continue")).toHaveCount(0);
    expect(
      (await page.context().cookies()).filter((cookie) =>
        ["refresh_token", "session_id"].includes(cookie.name),
      ),
    ).toHaveLength(2);

    failMe = false;
    await freshTab.getByRole("button", { name: "Try again" }).click();
    await expect(
      freshTab.getByRole("heading", { level: 1, name: /Learn something new/ }),
    ).toBeVisible({ timeout: 15_000 });
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
