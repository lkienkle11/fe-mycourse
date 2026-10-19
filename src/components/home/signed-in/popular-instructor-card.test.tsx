import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import type { PopularInstructorItem } from "@/types/instructor";
import { PopularInstructorCard } from "./popular-instructor-card";

const item: PopularInstructorItem = {
  user_id: "u1",
  display_name: "Ada Lovelace",
  slug: "",
  subtitle: "Mobile engineer",
  course_count: 3,
};

describe("PopularInstructorCard", () => {
  it("shows name and subtitle with initials when there is no picture, and is not a link", () => {
    render(<PopularInstructorCard item={item} />);
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Mobile engineer")).toBeInTheDocument();
    expect(screen.getByText("AL")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders the picture from the avatar field and omits an absent subtitle", () => {
    const { container } = render(
      <PopularInstructorCard
        item={{ ...item, avatar: "/pic.png", subtitle: undefined }}
      />,
    );
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("pic.png"),
    );
    expect(screen.queryByText("Mobile engineer")).not.toBeInTheDocument();
  });
});
