import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { act, fireEvent, screen } from "@testing-library/react";
import { ApiHttpError } from "@/api/core/fetch-error";
import messages from "@/messages/en";
import { useMeStore } from "@/store/auth";
import { buildMeResponse } from "@/test-support/fixtures/auth";
import {
  buildMockAppRouter,
  MockAppRouterProvider,
} from "@/test-support/mock-app-router";
import { renderWithProviders } from "@/test-support/render";
import {
  DashboardLayout,
  resetDashboardAutoPromptTracking,
} from "./dashboard-layout";

/**
 * Covers the `dashboard-access-control` "Unauthenticated denial
 * automatically prompts login" requirement (`specs/dashboard-access-control/spec.md`
 * in the `route-based-auth-modal` change).
 */
function renderDenied(isAuthorized: boolean, router = buildMockAppRouter()) {
  const view = renderWithProviders(
    <MockAppRouterProvider router={router}>
      <DashboardLayout items={[]} isAuthorized={isAuthorized}>
        <div>protected content</div>
      </DashboardLayout>
    </MockAppRouterProvider>,
  );
  return { router, ...view };
}

describe("DashboardLayout — unauthorized auto-prompt", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetDashboardAutoPromptTracking();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not navigate to login before the 500ms delay elapses", () => {
    useMeStore.setState({ me: null, isLoading: false });
    const { router } = renderDenied(false);

    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(router.push).not.toHaveBeenCalled();
  });

  it("navigates to /login with a next param once the delay elapses (unauthorized)", () => {
    useMeStore.setState({ me: null, isLoading: false });
    const { router } = renderDenied(false);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(router.push).toHaveBeenCalledTimes(1);
    // `next-intl`'s router prefixes the locale itself; jsdom's default
    // pathname doesn't carry a real dashboard path to round-trip as `next`,
    // so this pins down "navigated to the login destination" specifically.
    expect(router.push).toHaveBeenCalledWith(
      expect.stringMatching(/\/login(\?.*)?$/),
    );
  });

  it("does not fire again after the delay has already elapsed once", () => {
    useMeStore.setState({ me: null, isLoading: false });
    const { router } = renderDenied(false);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(router.push).toHaveBeenCalledTimes(1);
  });

  it("never navigates for the forbidden reason (authenticated, missing permission)", () => {
    useMeStore.setState({ me: buildMeResponse(), isLoading: false });
    const { router } = renderDenied(false);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(router.push).not.toHaveBeenCalled();
  });

  it("does not re-prompt after a dismiss-and-remount on the same denied path", () => {
    // Regression test: dismissing the intercepted /login modal (router.back())
    // remounts DashboardLayout on the same path (it's the `children` behind
    // the `@modal` slot, not preserved as a live instance across that trip).
    // A fresh component instance must still not re-schedule the prompt.
    useMeStore.setState({ me: null, isLoading: false });
    const router = buildMockAppRouter();
    const first = renderDenied(false, router);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(router.push).toHaveBeenCalledTimes(1);

    first.unmount();
    renderDenied(false, router);

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(router.push).toHaveBeenCalledTimes(1);
  });

  it("re-arms after a genuine reload (module state cleared), unlike a dismiss remount", () => {
    // A real browser refresh re-evaluates this module from scratch, which
    // clears `autoPromptedPaths` — simulated here by calling the same reset
    // the test harness uses between test cases, in the middle of one test.
    useMeStore.setState({ me: null, isLoading: false });
    const router = buildMockAppRouter();
    const first = renderDenied(false, router);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(router.push).toHaveBeenCalledTimes(1);

    first.unmount();
    resetDashboardAutoPromptTracking();
    renderDenied(false, router);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(router.push).toHaveBeenCalledTimes(2);
  });
});

describe("DashboardLayout — current-user outage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetDashboardAutoPromptTracking();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function outageError(status: number) {
    return new ApiHttpError({
      message: `HTTP ${status}`,
      response: { status, data: {}, headers: {} },
      request: { url: "/api/v1/me", method: "GET", retried: false },
    });
  }

  it("shows the server-error state with a retry and never prompts login", () => {
    const mutateMe = jest.fn();
    useMeStore.setState({
      me: null,
      isLoading: false,
      isError: outageError(503),
      mutateMe,
    });
    const { router } = renderDenied(false);

    expect(
      screen.getByRole("heading", {
        name: messages.errors.statusPage["server-error"].title,
      }),
    ).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(router.push).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: messages.errors.boundary.retry }),
    );
    expect(mutateMe).toHaveBeenCalledTimes(1);
  });

  it("keeps the unauthorized state and the auto-prompt for a 404 /me error", () => {
    useMeStore.setState({
      me: null,
      isLoading: false,
      isError: outageError(404),
    });
    const { router } = renderDenied(false);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(router.push).toHaveBeenCalledTimes(1);
  });
});
