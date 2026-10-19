import { describe, expect, it } from "@jest/globals";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test-support/render";
import type { TrendingCourseItem } from "@/types/course";
import { TrendingCourseCard } from "./trending-course-card";

const item: TrendingCourseItem = {
  id: "c1",
  slug: "intro-to-go",
  title: "Intro to Go",
  short_description: "Learn Go from scratch",
  owner_display_name: "Ada",
  created_at: 1,
};

describe("TrendingCourseCard", () => {
  it("shows title, owner and description, and no price, rating or badge", () => {
    renderWithProviders(<TrendingCourseCard item={item} />);
    expect(screen.getByText("Intro to Go")).toBeInTheDocument();
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.getByText("Learn Go from scratch")).toBeInTheDocument();
    expect(screen.queryByText(/\$|%|Best Seller/)).not.toBeInTheDocument();
  });

  it("links to the course page and works without a thumbnail or owner", () => {
    renderWithProviders(
      <TrendingCourseCard item={{ ...item, owner_display_name: undefined }} />,
    );
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/en/courses/intro-to-go",
    );
    expect(screen.queryByText("Ada")).not.toBeInTheDocument();
  });

  it("renders a non-link card when the slug is empty", () => {
    renderWithProviders(<TrendingCourseCard item={{ ...item, slug: "" }} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
