import { describe, expect, it } from "@jest/globals";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test-support/render";
import CourseDetailRoutePage from "./page";

describe("/courses/[slug] route", () => {
  it("shows the temporary message and a link back to the signed-in home", () => {
    renderWithProviders(<CourseDetailRoutePage />);
    expect(
      screen.getByRole("heading", { name: "Course page coming soon" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/en/home",
    );
  });
});
