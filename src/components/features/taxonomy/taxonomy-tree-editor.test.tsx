import { describe, expect, it, jest } from "@jest/globals";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test-support/render";
import type { TaxonomyTreeNode } from "@/types/taxonomy";
import { TaxonomyTreeEditor } from "./taxonomy-tree-editor";

const tree: TaxonomyTreeNode[] = [
  {
    id: "node-1",
    name: "Go",
    slug: "go",
    translations: { en: { name: "Go" } },
    children: [{ id: "node-2", name: "Gin", slug: "gin" }],
  },
];

function renderEditor(
  props: Partial<React.ComponentProps<typeof TaxonomyTreeEditor>> = {},
) {
  const onChange = jest.fn<(value: TaxonomyTreeNode[]) => void>();
  const view = renderWithProviders(
    <TaxonomyTreeEditor
      resourceKey="topics"
      value={tree}
      onChange={onChange}
      {...props}
    />,
  );
  return { ...view, onChange };
}

describe("TaxonomyTreeEditor", () => {
  it("renders every node's name and slug", () => {
    renderEditor();
    expect(screen.getByDisplayValue("Go")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Gin")).toBeInTheDocument();
    expect(screen.getByText("go")).toBeInTheDocument();
    expect(screen.getByText("gin")).toBeInTheDocument();
  });

  it("uses skill labels for skills", () => {
    renderEditor({ resourceKey: "skills" });
    expect(
      screen.getAllByRole("button", { name: "Add sub-skill" }),
    ).not.toHaveLength(0);
  });

  it("patches only the edited nested node slug and keeps translations", async () => {
    const { user, onChange } = renderEditor();

    const [, nestedEdit] = screen.getAllByRole("button", {
      name: "Edit slug",
    });
    await user.click(nestedEdit);
    await user.type(
      screen.getByRole("textbox", { name: "Sub-topic slug" }),
      "x",
    );

    const next = onChange.mock.calls.at(-1)?.[0] as TaxonomyTreeNode[];
    expect(next[0].slug).toBe("go");
    expect(next[0].translations).toEqual({ en: { name: "Go" } });
    expect(next[0].children?.[0].slug).toBe("ginx");
  });

  it("writes a renamed node under the edit locale translations", async () => {
    const { user, onChange } = renderEditor({ editLocale: "vi" });

    const [rootName] = screen.getAllByPlaceholderText("Sub-topic name");
    await user.type(rootName, "V");

    const next = onChange.mock.calls.at(-1)?.[0] as TaxonomyTreeNode[];
    expect(next[0].name).toBe("Go");
    expect(next[0].translations?.vi).toEqual({ name: "V" });
  });

  it("opens the inline input for a node with a slug error", () => {
    renderEditor({ slugErrors: { "node-2": "Please enter a slug." } });
    expect(
      screen.getByRole("textbox", { name: "Sub-topic slug" }),
    ).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Please enter a slug.")).toBeInTheDocument();
  });
});
