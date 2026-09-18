import { describe, expect, it, jest } from "@jest/globals";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test-support/render";
import ErrorBoundary from "./error";

describe("[locale]/error.tsx boundary", () => {
  it("renders a generic recoverable error state and retries via reset()", () => {
    const reset = jest.fn();
    renderWithProviders(
      <ErrorBoundary error={new Error("boom")} reset={reset} />,
    );

    expect(
      screen.getByRole("heading", { name: "Oops, something went wrong" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Something unexpected happened on our end. You can try again, or head back to the homepage.",
      ),
    ).toBeInTheDocument();

    screen.getByRole("button", { name: "Try again" }).click();
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
