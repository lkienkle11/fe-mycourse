import { describe, expect, it } from "@jest/globals";
import { AuthModalBackgroundBridge } from "@/components/providers/auth-modal-background-bridge";
import {
  buildMockAppRouter,
  MockAppRouterProvider,
} from "@/test-support/mock-app-router";
import { renderWithProviders } from "@/test-support/render";
import { shouldBounceToBackground } from "./use-auth-modal-background-bridge";

/**
 * Full end-to-end coverage of the bounce (hard-load `/login?next=X` ->
 * replace to X -> push back to `/login?next=X` as a soft nav) needs a real
 * Next.js router/interception context that jsdom does not provide (see
 * `use-auth-next-param.test.tsx`'s note on the same limitation - confirmed
 * again here: neither `window.history.pushState` nor mocking `next/navigation`
 * makes `usePathname()` reflect a real path under jsdom, it stays `null`).
 * `shouldBounceToBackground` is exported specifically so the decision that
 * matters can still be unit tested directly, without a routing context.
 */
describe("AuthModalBackgroundBridge", () => {
  it("does not navigate on a non-auth route", () => {
    const router = buildMockAppRouter();
    renderWithProviders(
      <MockAppRouterProvider router={router}>
        <AuthModalBackgroundBridge />
      </MockAppRouterProvider>,
    );

    expect(router.replace).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });
});

describe("shouldBounceToBackground", () => {
  it("bounces from /login to a validated next path", () => {
    expect(shouldBounceToBackground("/login", "/instructor")).toBe(true);
  });

  it("bounces from /signup to a validated next path", () => {
    expect(shouldBounceToBackground("/signup", "/instructor")).toBe(true);
  });

  it("never bounces when next is /login or /signup (self-reference or the other auth route)", () => {
    // Regression: without this guard, bouncing here would stall forever -
    // the reopen effect waits for pathname to leave {"/login", "/signup"},
    // which a bounce landing back on one of them would never satisfy.
    expect(shouldBounceToBackground("/login", "/login")).toBe(false);
    expect(shouldBounceToBackground("/login", "/signup")).toBe(false);
    expect(shouldBounceToBackground("/signup", "/login")).toBe(false);
    expect(shouldBounceToBackground("/signup", "/signup")).toBe(false);
  });

  it("never bounces when not on /login or /signup", () => {
    expect(shouldBounceToBackground("/instructor", "/home")).toBe(false);
  });

  it("never bounces when there is no next path", () => {
    expect(shouldBounceToBackground("/login", null)).toBe(false);
  });
});
