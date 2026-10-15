import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { FormField } from "./form-field";

describe("FormField", () => {
  it("associates the label with the control through the id", () => {
    render(
      <FormField id="title" label="Title">
        <input id="title" />
      </FormField>,
    );

    expect(screen.getByLabelText(/Title/)).toBeTruthy();
  });

  it("shows the required marker by default and hides it when required is false", () => {
    const { rerender, container } = render(
      <FormField id="a" label="Name">
        <input id="a" />
      </FormField>,
    );
    expect(container.textContent).toContain("*");

    rerender(
      <FormField id="a" label="Name" required={false}>
        <input id="a" />
      </FormField>,
    );
    expect(container.textContent).not.toContain("*");
  });

  it("renders the hint only when provided", () => {
    const { rerender } = render(
      <FormField id="a" label="Name" hint="Optional">
        <input id="a" />
      </FormField>,
    );
    expect(screen.getByText("Optional")).toBeTruthy();

    rerender(
      <FormField id="a" label="Name">
        <input id="a" />
      </FormField>,
    );
    expect(screen.queryByText("Optional")).toBeNull();
  });

  it("renders the error message only when an error is set", () => {
    const { rerender } = render(
      <FormField
        id="a"
        label="Name"
        error={{ type: "validate", message: "k" }}
        errorMessage="Name is required."
      >
        <input id="a" />
      </FormField>,
    );
    expect(screen.getByText("Name is required.")).toBeTruthy();

    rerender(
      <FormField id="a" label="Name" errorMessage="Name is required.">
        <input id="a" />
      </FormField>,
    );
    expect(screen.queryByText("Name is required.")).toBeNull();
  });
});
