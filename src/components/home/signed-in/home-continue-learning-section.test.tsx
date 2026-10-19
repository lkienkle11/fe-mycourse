import { describe, expect, it, jest } from "@jest/globals";
import { screen } from "@testing-library/react";
import { http } from "msw";
import { PERMISSIONS } from "@/constants/permissions";
import { seedSignedInMe } from "@/test-support/fixtures/auth";
import { okEnvelope } from "@/test-support/msw/envelope";
import { server } from "@/test-support/msw/server";
import { renderWithProviders } from "@/test-support/render";
import { HomeContinueLearningSection } from "./home-continue-learning-section";

function buildRows(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    course_id: `c${i + 1}`,
    slug: `course-${i + 1}`,
    title: `Course ${i + 1}`,
    completed_sub_lessons: 1,
    total_sub_lessons: 4,
    progress_percent: 25,
    last_activity_at: 1,
  }));
}

describe("HomeContinueLearningSection", () => {
  it("renders nothing and makes no request without the course-read permission", () => {
    const handler = jest.fn(() => okEnvelope([]));
    server.use(http.get("*/api/v1/learner-courses/continue", handler));
    seedSignedInMe([]);

    const { container } = renderWithProviders(<HomeContinueLearningSection />);

    expect(container).toBeEmptyDOMElement();
    expect(handler).not.toHaveBeenCalled();
  });

  it("renders nothing for a guest", () => {
    const { container } = renderWithProviders(<HomeContinueLearningSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows progress, then expands once to 10 courses and hides the control", async () => {
    const limits: string[] = [];
    server.use(
      http.get("*/api/v1/learner-courses/continue", ({ request }) => {
        const limit = new URL(request.url).searchParams.get("limit") ?? "";
        limits.push(limit);
        return okEnvelope(buildRows(Number(limit)));
      }),
    );
    seedSignedInMe([PERMISSIONS.CourseRead]);
    const { user } = renderWithProviders(<HomeContinueLearningSection />);

    await screen.findByText("Course 3");
    expect(screen.queryByText("Course 4")).not.toBeInTheDocument();
    expect(screen.getAllByText("1/4 sub-lessons completed")).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: "Expand More" }));
    await screen.findByText("Course 10");
    expect(limits).toEqual(["3", "10"]);
    expect(
      screen.queryByRole("button", { name: "Expand More" }),
    ).not.toBeInTheDocument();
  });

  it("shows the empty state when the learner has no enrollments", async () => {
    server.use(
      http.get("*/api/v1/learner-courses/continue", () => okEnvelope([])),
    );
    seedSignedInMe([PERMISSIONS.CourseRead]);
    renderWithProviders(<HomeContinueLearningSection />);
    expect(
      await screen.findByText("You have no courses in progress yet."),
    ).toBeVisible();
  });
});
