import { describe, expect, it } from "@jest/globals";
import {
  countTreeNodes,
  findTreeNodeById,
  findTreePath,
  flattenTree,
  getTreeMaxDepth,
  updateTreeNode,
  walkTree,
} from "./tree";

type Node = { id: string; label?: string; children?: Node[] };

const tree: Node[] = [
  {
    id: "a",
    children: [
      { id: "a1", children: [{ id: "a1x" }] },
      { id: "a2", label: "second" },
    ],
  },
  { id: "b" },
];

describe("walkTree", () => {
  it("visits nodes in pre-order with depth, parent and index", () => {
    const seen: string[] = [];
    walkTree(tree, (node, { depth, parent, index }) => {
      seen.push(`${node.id}:${depth}:${parent?.id ?? "-"}:${index}`);
    });
    expect(seen).toEqual([
      "a:0:-:0",
      "a1:1:a:0",
      "a1x:2:a1:0",
      "a2:1:a:1",
      "b:0:-:1",
    ]);
  });

  it("does nothing for undefined or empty input", () => {
    const visit = () => {
      throw new Error("must not be called");
    };
    expect(() => walkTree(undefined, visit)).not.toThrow();
    expect(() => walkTree([], visit)).not.toThrow();
  });
});

describe("flattenTree / countTreeNodes / getTreeMaxDepth", () => {
  it("flattens in pre-order", () => {
    expect(flattenTree(tree).map((n) => n.id)).toEqual([
      "a",
      "a1",
      "a1x",
      "a2",
      "b",
    ]);
  });

  it("counts every node (empty tree is 0)", () => {
    expect(countTreeNodes(tree)).toBe(5);
    expect(countTreeNodes([])).toBe(0);
    expect(countTreeNodes(undefined)).toBe(0);
  });

  it("reports the maximum depth with roots at 0 (empty tree is 0)", () => {
    expect(getTreeMaxDepth(tree)).toBe(2);
    expect(getTreeMaxDepth([{ id: "only" }])).toBe(0);
    expect(getTreeMaxDepth([])).toBe(0);
  });
});

describe("findTreePath / findTreeNodeById", () => {
  it("returns the ancestor chain including the match", () => {
    const path = findTreePath(tree, (n) => n.id === "a1x");
    expect(path?.map((n) => n.id)).toEqual(["a", "a1", "a1x"]);
  });

  it("returns the first match in pre-order", () => {
    const path = findTreePath(tree, (n) => n.id.startsWith("a"));
    expect(path?.map((n) => n.id)).toEqual(["a"]);
  });

  it("returns null when nothing matches", () => {
    expect(findTreePath(tree, (n) => n.id === "zzz")).toBeNull();
    expect(findTreeNodeById(tree, "zzz")).toBeNull();
    expect(findTreeNodeById(undefined, "a")).toBeNull();
  });

  it("finds a node by id at any depth", () => {
    expect(findTreeNodeById(tree, "a2")?.label).toBe("second");
  });
});

describe("updateTreeNode", () => {
  it("patches a nested node without mutating the input", () => {
    const snapshot = JSON.stringify(tree);
    const next = updateTreeNode(tree, "a1x", (n) => ({ ...n, label: "x" }));
    expect(findTreeNodeById(next, "a1x")?.label).toBe("x");
    expect(JSON.stringify(tree)).toBe(snapshot);
  });

  it("shares untouched branches", () => {
    const next = updateTreeNode(tree, "a2", (n) => ({ ...n, label: "new" }));
    expect(next).not.toBe(tree);
    expect(next[1]).toBe(tree[1]);
    expect(next[0].children?.[0]).toBe(tree[0].children?.[0]);
  });

  it("returns the same array when the id is absent", () => {
    expect(updateTreeNode(tree, "missing", (n) => n)).toBe(tree);
  });

  it("patches a root node", () => {
    const next = updateTreeNode(tree, "b", (n) => ({ ...n, label: "root" }));
    expect(next[1].label).toBe("root");
    expect(next[0]).toBe(tree[0]);
  });
});
