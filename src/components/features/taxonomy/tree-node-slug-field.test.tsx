import { describe, expect, it, jest } from "@jest/globals";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test-support/render";
import { TreeNodeSlugField } from "./tree-node-slug-field";

const labels = {
  slugPlaceholder: "Sub-topic slug",
  slugAuto: "Generated from the name",
  slugEdit: "Edit slug",
  slugDone: "Done editing slug",
};

function renderField(
  props: Partial<React.ComponentProps<typeof TreeNodeSlugField>> = {},
) {
  const onSlugChange = jest.fn<(slug: string) => void>();
  const view = renderWithProviders(
    <TreeNodeSlugField
      slug=""
      labels={labels}
      onSlugChange={onSlugChange}
      {...props}
    />,
  );
  return { ...view, onSlugChange };
}

describe("TreeNodeSlugField", () => {
  it("shows the auto-generated hint while the node has no slug", () => {
    renderField();
    expect(screen.getByText("Generated from the name")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("shows the stored slug as read-only text", () => {
    renderField({ slug: "golang" });
    expect(screen.getByText("golang")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("opens an input on edit, reports changes and closes on done", async () => {
    const { user, onSlugChange } = renderField({ slug: "go" });

    await user.click(screen.getByRole("button", { name: "Edit slug" }));
    const input = screen.getByRole("textbox", { name: "Sub-topic slug" });
    await user.type(input, "x");
    expect(onSlugChange).toHaveBeenCalledWith("gox");

    await user.click(screen.getByRole("button", { name: "Done editing slug" }));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("stays open and shows the error while an error is set", () => {
    renderField({ slug: "", error: "Please enter a slug." });
    expect(
      screen.getByRole("textbox", { name: "Sub-topic slug" }),
    ).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Please enter a slug.")).toBeInTheDocument();
  });
});
