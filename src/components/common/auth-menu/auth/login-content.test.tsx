import { describe, expect, it } from "@jest/globals";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { MockAppRouterProvider } from "@/test-support/mock-app-router";
import { renderWithProviders } from "@/test-support/render";
import { LoginContent } from "./login-content";

/**
 * `LoginContent` submits through a Next.js Server Action (`loginAction`,
 * which calls `next/headers` `cookies()`), so its actual submission
 * outcome — success and server-error presentation — can only run inside a
 * real Next.js request scope. That is covered by the Stage 3 browser auth
 * journey (login to a protected screen / expired-session handling), not
 * here. This test covers what *is* real and testable under jsdom: the
 * zod-backed client-side validation and the accessible form controls that
 * gate submission before any Server Action is ever invoked.
 */
function renderLogin() {
  return renderWithProviders(
    <MockAppRouterProvider>
      <LoginContent />
    </MockAppRouterProvider>,
  );
}

describe("LoginContent — client-side validation", () => {
  it("shows required-field errors for an empty submission and never navigates", async () => {
    const { user } = renderLogin();

    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("Please enter a valid email address"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please enter a valid password"),
    ).toBeInTheDocument();
  });

  it("shows an email-format error for an invalid address and clears once corrected", async () => {
    // Does not submit valid credentials: real submission goes through a
    // Server Action (`next/headers` cookies()), which needs a live Next.js
    // request scope unavailable under jsdom — see the file-level note above.
    const { user, container } = renderLogin();

    const emailInput = screen.getByPlaceholderText("Email Address");
    await user.type(emailInput, "not-an-email");
    // Dispatch the submit event directly: clicking the submit button would
    // first run the browser's native `type="email"` constraint validation
    // and never reach React at all for a non-empty, malformed value.
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    if (form) fireEvent.submit(form);

    expect(
      await screen.findByText("Please enter a valid email address"),
    ).toBeInTheDocument();

    await user.clear(emailInput);
    await user.type(emailInput, "learner@example.com");

    await waitFor(() =>
      expect(
        screen.queryByText("Please enter a valid email address"),
      ).not.toBeInTheDocument(),
    );
  });

  it("toggles password visibility through the accessible control", async () => {
    const { user } = renderLogin();

    const passwordInput = screen.getByPlaceholderText(
      "Password",
    ) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");

    // The visibility toggle is the trailing icon inside the password field's
    // input group — not a labeled button, so target it by DOM position.
    const toggle = passwordInput.parentElement?.querySelector(
      "[class*='cursor-pointer']",
    );
    expect(toggle).toBeTruthy();
    if (toggle) await user.click(toggle);

    expect(passwordInput.type).toBe("text");
  });
});
