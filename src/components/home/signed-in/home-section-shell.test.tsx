import { describe, expect, it, jest } from "@jest/globals";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test-support/render";
import { HomeSectionShell } from "./home-section-shell";

function renderShell(
  overrides: Partial<Parameters<typeof HomeSectionShell>[0]> = {},
) {
  const onRetry = jest.fn();
  const view = renderWithProviders(
    <HomeSectionShell
      title="Section title"
      description="Section description"
      isLoading={false}
      hasError={false}
      isEmpty={false}
      onRetry={onRetry}
      skeletonCount={3}
      gridClassName="grid"
      skeletonItemClassName="h-4"
      emptyMessage="Nothing here"
      errorMessage="Something failed"
      retryLabel="Retry now"
      footer={<span>footer</span>}
      {...overrides}
    >
      <p>content</p>
    </HomeSectionShell>,
  );
  return { ...view, onRetry };
}

describe("HomeSectionShell", () => {
  it("renders the header, the content and the footer", () => {
    renderShell();
    expect(
      screen.getByRole("heading", { name: "Section title" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Section description")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
    expect(screen.getByText("footer")).toBeInTheDocument();
  });

  it("renders skeleton placeholders only while loading", () => {
    const { container } = renderShell({ isLoading: true });
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      3,
    );
    expect(screen.queryByText("content")).not.toBeInTheDocument();
    expect(screen.queryByText("footer")).not.toBeInTheDocument();
  });

  it("lays the items out as a swipeable snap row on mobile and a grid from sm", () => {
    renderShell({ gridClassName: "sm:grid-cols-2" });
    const row = screen.getByText("content").parentElement;
    expect(row).toHaveClass(
      "flex",
      "snap-x",
      "snap-mandatory",
      "overflow-x-auto",
      "sm:grid",
      "sm:grid-cols-2",
    );
  });

  it("gives the skeletons the same row so the layout does not jump", () => {
    const { container } = renderShell({
      isLoading: true,
      gridClassName: "sm:grid-cols-2",
    });
    const row = container.querySelector(
      '[data-slot="skeleton"]',
    )?.parentElement;
    expect(row).toHaveClass("flex", "snap-x", "sm:grid", "sm:grid-cols-2");
  });

  it("renders the empty message", () => {
    renderShell({ isEmpty: true });
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.queryByText("content")).not.toBeInTheDocument();
  });

  it("renders the error with a retry that calls back", async () => {
    const { onRetry, user } = renderShell({ hasError: true });
    expect(screen.getByRole("alert")).toHaveTextContent("Something failed");
    await user.click(screen.getByRole("button", { name: "Retry now" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
