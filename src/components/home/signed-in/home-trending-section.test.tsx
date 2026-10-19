import { describe, expect, it } from "@jest/globals";
import { screen, waitFor } from "@testing-library/react";
import { http } from "msw";
import { okEnvelope } from "@/test-support/msw/envelope";
import { server } from "@/test-support/msw/server";
import { renderWithProviders } from "@/test-support/render";
import { HomeTrendingSection } from "./home-trending-section";

function buildRows(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    slug: `course-${i + 1}`,
    title: `Course ${i + 1}`,
    short_description: "desc",
    created_at: 1,
  }));
}

describe("HomeTrendingSection", () => {
  it("shows 8 courses, expands once to the maximum limit and then hides the control", async () => {
    const limits: string[] = [];
    server.use(
      http.get("*/api/v1/catalog/courses/trending", ({ request }) => {
        const limit = new URL(request.url).searchParams.get("limit") ?? "";
        limits.push(limit);
        return okEnvelope(buildRows(Number(limit)));
      }),
    );
    const { user } = renderWithProviders(<HomeTrendingSection />);

    await screen.findByText("Course 8");
    expect(screen.queryByText("Course 9")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expand More" }));
    await screen.findByText("Course 24");
    expect(limits).toEqual(["8", "24"]);
    expect(
      screen.queryByRole("button", { name: "Expand More" }),
    ).not.toBeInTheDocument();
  });

  it("does not offer Expand More when fewer courses than the initial limit exist", async () => {
    server.use(
      http.get("*/api/v1/catalog/courses/trending", () =>
        okEnvelope(buildRows(3)),
      ),
    );
    renderWithProviders(<HomeTrendingSection />);

    await screen.findByText("Course 3");
    expect(
      screen.queryByRole("button", { name: "Expand More" }),
    ).not.toBeInTheDocument();
  });

  it("shows the empty state", async () => {
    server.use(
      http.get("*/api/v1/catalog/courses/trending", () => okEnvelope([])),
    );
    renderWithProviders(<HomeTrendingSection />);
    expect(await screen.findByText("No trending courses yet.")).toBeVisible();
  });

  it("shows an error with a retry that recovers", async () => {
    let fail = true;
    server.use(
      http.get("*/api/v1/catalog/courses/trending", () =>
        fail ? new Response("{}", { status: 500 }) : okEnvelope(buildRows(2)),
      ),
    );
    const { user } = renderWithProviders(<HomeTrendingSection />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("We could not load trending courses.");

    fail = false;
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() =>
      expect(screen.getByText("Course 1")).toBeInTheDocument(),
    );
  });
});
