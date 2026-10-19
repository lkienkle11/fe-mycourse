import { describe, expect, it } from "@jest/globals";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test-support/render";
import { HeroCarousel } from "./hero-carousel";

describe("HeroCarousel", () => {
  it("renders exactly one level-one heading and the sub-headline", () => {
    renderWithProviders(<HeroCarousel />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Learn something new everyday." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Become professionals and ready to join the world."),
    ).toBeInTheDocument();
  });

  it("renders the three Figma slides with their own copy", () => {
    renderWithProviders(<HeroCarousel />);
    expect(screen.getAllByRole("group")).toHaveLength(3);
    expect(screen.getByText("Learn from the best.")).toBeInTheDocument();
    expect(
      screen.getByText("Courses built by real industry experts."),
    ).toBeInTheDocument();
    expect(screen.getByText("Learn at your own pace.")).toBeInTheDocument();
    expect(
      screen.getByText("Anytime, anywhere, no deadlines."),
    ).toBeInTheDocument();
  });

  it("has no previous or next arrow buttons, only three dots", () => {
    renderWithProviders(<HeroCarousel />);
    expect(screen.queryByRole("button", { name: "Previous slide" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Next slide" })).toBeNull();
    expect(screen.getAllByRole("button", { name: /Go to slide/ })).toHaveLength(
      3,
    );
  });

  it("marks the first dot as current initially", () => {
    renderWithProviders(<HeroCarousel />);
    expect(
      screen.getByRole("button", { name: "Go to slide 1" }),
    ).toHaveAttribute("aria-current", "true");
  });
});
