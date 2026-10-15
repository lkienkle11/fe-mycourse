import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import { SlugField } from "./slug-field";

describe("SlugField", () => {
  it("renders the label, hint and the filtered controlled input", () => {
    const onValueChange = jest.fn();
    render(
      <SlugField
        id="slug"
        label="Slug"
        hint="Lowercase only"
        placeholder="my-slug"
        value=""
        onValueChange={onValueChange}
      />,
    );

    expect(screen.getByText("Lowercase only")).toBeTruthy();
    const input = screen.getByLabelText(/Slug/) as HTMLInputElement;
    expect(input.id).toBe("slug");
    expect(input.placeholder).toBe("my-slug");

    fireEvent.change(input, { target: { value: "Go Course!" } });
    expect(onValueChange).toHaveBeenCalledWith("o-ourse");
  });

  it("passes disabled and name through to the input", () => {
    render(
      <SlugField
        id="slug"
        label="Slug"
        name="slug"
        value="abc"
        disabled
        onValueChange={jest.fn()}
      />,
    );

    const input = screen.getByLabelText(/Slug/) as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(input.name).toBe("slug");
  });

  it("shows the error message when an error is provided", () => {
    render(
      <SlugField
        id="slug"
        label="Slug"
        value="-"
        onValueChange={jest.fn()}
        error={{ type: "validate", message: "validation.slugInvalid" }}
        errorMessage="Invalid slug."
      />,
    );

    expect(screen.getByText("Invalid slug.")).toBeTruthy();
  });
});
