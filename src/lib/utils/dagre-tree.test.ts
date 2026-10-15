import { describe, expect, it } from "@jest/globals";
import { type DagreTreeRoot, treeToFlowElements } from "./dagre-tree";

const root: DagreTreeRoot = {
  id: "root",
  name: "Topic",
  slug: "topic",
  children: [
    { id: "a", name: "A", children: [{ id: "a1", name: "A1" }] },
    { id: "b", name: "B" },
  ],
};

describe("treeToFlowElements", () => {
  it("emits one node per tree node in pre-order with the name as label", () => {
    const { nodes } = treeToFlowElements(root);

    expect(nodes.map((node) => node.id)).toEqual(["root", "a", "a1", "b"]);
    expect(nodes.map((node) => node.data.label)).toEqual([
      "Topic",
      "A",
      "A1",
      "B",
    ]);
  });

  it("emits a smoothstep edge from every parent to its child", () => {
    const { edges } = treeToFlowElements(root);

    expect(
      edges.map((edge) => [edge.id, edge.source, edge.target, edge.type]),
    ).toEqual([
      ["root-a", "root", "a", "smoothstep"],
      ["a-a1", "a", "a1", "smoothstep"],
      ["root-b", "root", "b", "smoothstep"],
    ]);
  });

  it("lays out a single node without edges", () => {
    const { nodes, edges } = treeToFlowElements({ id: "solo", name: "Solo" });

    expect(nodes).toHaveLength(1);
    expect(edges).toHaveLength(0);
  });

  it("positions nodes horizontally with left/right handles", () => {
    const { nodes } = treeToFlowElements(root, "horizontal");

    expect(nodes[0].targetPosition).toBe("left");
    expect(nodes[0].sourcePosition).toBe("right");
  });
});
