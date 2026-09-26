import { describe, expect, it } from "@jest/globals";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import {
  buildMockAppRouter,
  MockAppRouterProvider,
} from "@/test-support/mock-app-router";
import { renderWithProviders } from "@/test-support/render";
import { LoginSignupPopup } from "./login-signup-popup";

describe("LoginSignupPopup", () => {
  it('renders the login form for type="login"', () => {
    renderWithProviders(
      <MockAppRouterProvider>
        <LoginSignupPopup type="login" />
      </MockAppRouterProvider>,
    );

    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it('renders the signup form for type="signup"', () => {
    renderWithProviders(
      <MockAppRouterProvider>
        <LoginSignupPopup type="signup" />
      </MockAppRouterProvider>,
    );

    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
  });

  it("closes via router.back() after the exit animation, not immediately", async () => {
    const router = buildMockAppRouter();
    renderWithProviders(
      <MockAppRouterProvider router={router}>
        <LoginSignupPopup type="login" />
      </MockAppRouterProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(router.back).not.toHaveBeenCalled();

    await waitFor(() => expect(router.back).toHaveBeenCalledTimes(1));
  });
});
