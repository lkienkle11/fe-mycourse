import { describe, expect, it, jest } from "@jest/globals";
import { screen } from "@testing-library/react";
import { http } from "msw";
import { PERMISSIONS } from "@/constants/permissions";
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
