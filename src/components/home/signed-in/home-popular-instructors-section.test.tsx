import { describe, expect, it } from "@jest/globals";
import { screen } from "@testing-library/react";
import { http } from "msw";
import { okEnvelope } from "@/test-support/msw/envelope";
import { server } from "@/test-support/msw/server";
import { renderWithProviders } from "@/test-support/render";
import { HomePopularInstructorsSection } from "./home-popular-instructors-section";

describe("HomePopularInstructorsSection", () => {
  it("requests 4 instructors and shows them without an Expand More control", async () => {
    let requested = "";
    server.use(
      http.get("*/api/v1/catalog/instructors/popular", ({ request }) => {
        requested = new URL(request.url).searchParams.get("limit") ?? "";
        return okEnvelope([
          { user_id: "u1", display_name: "Ada", slug: "", course_count: 2 },
        ]);
      }),
    );
    renderWithProviders(<HomePopularInstructorsSection />);

    expect(await screen.findByText("Ada")).toBeInTheDocument();
    expect(requested).toBe("4");
    expect(
      screen.queryByRole("button", { name: "Expand More" }),
    ).not.toBeInTheDocument();
  });

  it("shows an error state for this section only", async () => {
    server.use(
      http.get(
        "*/api/v1/catalog/instructors/popular",
        () => new Response("{}", { status: 500 }),
      ),
    );
    renderWithProviders(<HomePopularInstructorsSection />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We could not load instructors.",
    );
  });
});
