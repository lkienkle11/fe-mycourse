import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import { SlugInput } from "./slug-input";

describe("SlugInput", () => {
  it("passes typed values through the slug filter", () => {
    const onValueChange = jest.fn();
    render(
      <SlugInput aria-label="slug" value="" onValueChange={onValueChange} />,
    );

    fireEvent.change(screen.getByLabelText("slug"), {
      target: { value: "Go Course!" },
    });

    expect(onValueChange).toHaveBeenCalledWith("o-ourse");
  });

  it("filters pasted mixed text down to allowed characters", () => {
    const onValueChange = jest.fn();
    render(
      <SlugInput aria-label="slug" value="" onValueChange={onValueChange} />,
    );

    fireEvent.change(screen.getByLabelText("slug"), {
      target: { value: "Khóa Học 01!" },
    });

    expect(onValueChange).toHaveBeenCalledWith("ha-c-01");
  });

  it("renders the controlled value and respects disabled", () => {
    render(
      <SlugInput
        aria-label="slug"
        value="golang-course"
        onValueChange={jest.fn()}
        disabled
      />,
    );

    const input = screen.getByLabelText("slug") as HTMLInputElement;
    expect(input.value).toBe("golang-course");
    expect(input.disabled).toBe(true);
  });
});
