import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { CourseThumbnail } from "./course-thumbnail";

describe("CourseThumbnail", () => {
  it("renders the remote image with the alternative text", () => {
    render(
      <CourseThumbnail src="https://cdn.example.com/t.png" alt="Intro thumb" />,
    );
    expect(screen.getByRole("img", { name: "Intro thumb" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/t.png",
    );
  });

  it("renders a placeholder and no image when there is no URL", () => {
    render(<CourseThumbnail alt="Intro thumb" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders overlay children inside the thumbnail", () => {
    render(
      <CourseThumbnail alt="x">
        <span>overlay</span>
      </CourseThumbnail>,
    );
    expect(screen.getByText("overlay")).toBeInTheDocument();
  });
});
