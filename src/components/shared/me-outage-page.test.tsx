import { describe, expect, it, jest } from "@jest/globals";
import { screen } from "@testing-library/react";
import messages from "@/messages/en";
import { renderWithProviders } from "@/test-support/render";
import { MeOutagePage } from "./me-outage-page";

describe("MeOutagePage", () => {
  it.each([
    "server-error",
    "network",
  ] as const)("renders the %s copy with a retry that calls the outage retry", async (variant) => {
    const retry = jest.fn();
    const { user } = renderWithProviders(
      <MeOutagePage outage={{ variant, retry }} />,
    );

    expect(
      screen.getByRole("heading", {
        name: messages.errors.statusPage[variant].title,
      }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: messages.errors.boundary.retry }),
    );

    expect(retry).toHaveBeenCalledTimes(1);
    // SWR's bound `mutate` treats a first argument as new data, so the click event must not reach it.
    expect(retry).toHaveBeenCalledWith();
  });
});
