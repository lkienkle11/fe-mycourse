import { describe, expect, it } from "@jest/globals";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test-support/render";
import type { ContinueLearningItem } from "@/types/course";
import { ContinueLearningCard } from "./continue-learning-card";

function buildItem(
  overrides: Partial<ContinueLearningItem> = {},
): ContinueLearningItem {
  return {
    course_id: "c1",
    slug: "intro-to-go",
    title: "Intro to Go",
    owner_display_name: "Ada",
    completed_sub_lessons: 4,
    total_sub_lessons: 10,
    progress_percent: 40,
    last_activity_at: 1,
    ...overrides,
  };
}

describe("ContinueLearningCard", () => {
  it("shows title, owner and the sub-lesson counts, not videos", () => {
    renderWithProviders(<ContinueLearningCard item={buildItem()} />);
    expect(screen.getByText("Intro to Go")).toBeInTheDocument();
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.getByText("4/10 sub-lessons completed")).toBeInTheDocument();
    expect(screen.queryByText(/video/i)).not.toBeInTheDocument();
  });

  it.each([
    [-5, 0],
    [150, 100],
    [12.5, 13],
  ])("clamps progress %s to a bar value of %s", (percent, expected) => {
    renderWithProviders(
      <ContinueLearningCard item={buildItem({ progress_percent: percent })} />,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      String(expected),
    );
  });

  it("links to the course page only when the slug is non-empty", () => {
    const { unmount } = renderWithProviders(
      <ContinueLearningCard item={buildItem()} />,
    );
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/en/courses/intro-to-go",
    );
    unmount();

    renderWithProviders(
      <ContinueLearningCard item={buildItem({ slug: "" })} />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("omits the owner line when the owner is absent", () => {
    renderWithProviders(
      <ContinueLearningCard
        item={buildItem({ owner_display_name: undefined })}
      />,
    );
    expect(screen.queryByText("Ada")).not.toBeInTheDocument();
  });
});
