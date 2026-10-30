import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react";
import { http } from "msw";
import { ApiHttpError } from "@/api/core/fetch-error";
import { PERMISSIONS } from "@/constants/permissions";
import messages from "@/messages/en";
import { useMeStore } from "@/store/auth";
import { seedSignedInMe } from "@/test-support/fixtures/auth";
import { okEnvelope } from "@/test-support/msw/envelope";
import { server } from "@/test-support/msw/server";
import { renderWithProviders } from "@/test-support/render";
import SignedInHomeRoutePage from "./page";

function mockHomeEndpoints() {
  const trending = jest.fn(() => okEnvelope([]));
  const popular = jest.fn(() => okEnvelope([]));
  const continueLearning = jest.fn(() => okEnvelope([]));
  server.use(
    http.get("*/api/v1/catalog/courses/trending", trending),
    http.get("*/api/v1/catalog/instructors/popular", popular),
    http.get("*/api/v1/learner-courses/continue", continueLearning),
  );
  return { trending, popular, continueLearning };
}

describe("/home route", () => {
  it("shows a loading indicator while the current user is loading", () => {
    const handlers = mockHomeEndpoints();
    renderWithProviders(<SignedInHomeRoutePage />);
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(handlers.trending).not.toHaveBeenCalled();
  });

  it("shows the sign-in prompt to a guest and requests no home data", () => {
    const handlers = mockHomeEndpoints();
    useMeStore.setState({ me: null, isLoading: false });
    renderWithProviders(<SignedInHomeRoutePage />);

    expect(screen.getByText("Sign in to continue")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      expect.stringContaining("next=%2Fhome"),
    );
    expect(handlers.trending).not.toHaveBeenCalled();
    expect(handlers.popular).not.toHaveBeenCalled();
    expect(handlers.continueLearning).not.toHaveBeenCalled();
  });

  it("shows the retryable server-error state, not the sign-in prompt, when the current user failed to load", () => {
    const handlers = mockHomeEndpoints();
    const mutateMe = jest.fn();
    useMeStore.setState({
      me: null,
      isLoading: false,
      isError: new ApiHttpError({
        message: "HTTP 503",
        response: { status: 503, data: {}, headers: {} },
        request: { url: "/api/v1/me", method: "GET", retried: false },
      }),
      mutateMe,
    });
    renderWithProviders(<SignedInHomeRoutePage />);

    expect(screen.queryByText("Sign in to continue")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: messages.errors.statusPage["server-error"].title,
      }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: messages.errors.boundary.retry }),
    );
    expect(mutateMe).toHaveBeenCalledTimes(1);
    expect(handlers.trending).not.toHaveBeenCalled();
  });

  it("renders the hero and all three sections for a user who can read courses", async () => {
    mockHomeEndpoints();
    seedSignedInMe([PERMISSIONS.CourseRead]);
    renderWithProviders(<SignedInHomeRoutePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /Learn something new/ }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Complete your Course" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Trending Course" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Popular Instructor" }),
    ).toBeInTheDocument();
  });

  it("omits Complete your Course for a user without course:read", async () => {
    const handlers = mockHomeEndpoints();
    seedSignedInMe([]);
    renderWithProviders(<SignedInHomeRoutePage />);

    await screen.findByRole("heading", { name: "Trending Course" });
    expect(
      screen.queryByRole("heading", { name: "Complete your Course" }),
    ).not.toBeInTheDocument();
    expect(handlers.continueLearning).not.toHaveBeenCalled();
  });
});
