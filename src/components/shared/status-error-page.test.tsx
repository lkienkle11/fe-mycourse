import { describe, expect, it, jest } from "@jest/globals";
import { screen } from "@testing-library/react";
import type { StatusErrorVariant } from "@/lib/utils/api-error";
import messages from "@/messages/en";
import { renderWithProviders } from "@/test-support/render";
import { StatusErrorPage } from "./status-error-page";

const variants: StatusErrorVariant[] = [
  "unauthorized",
  "forbidden",
  "server-error",
  "network",
];

describe("StatusErrorPage", () => {
  it.each(
    variants,
  )("renders the default copy for the %s variant", (variant) => {
    renderWithProviders(<StatusErrorPage variant={variant} />);

    const expected = messages.errors.statusPage[variant];
    expect(
      screen.getByRole("heading", { name: expected.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(expected.description)).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: messages.errors.statusPage.action.backToHome,
      }),
    ).toBeInTheDocument();
  });

  it("overrides title, description, and action when provided", () => {
    const onClick = jest.fn();
    renderWithProviders(
      <StatusErrorPage
        variant="forbidden"
        title="Custom title"
        description="Custom description"
        action={{ label: "Go back", onClick }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Custom title" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Custom description")).toBeInTheDocument();

    const button = screen.getByRole("button", { name: "Go back" });
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
