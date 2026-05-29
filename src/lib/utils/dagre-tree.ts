import { type Edge, type Node, Position } from "@xyflow/react";
import dagre from "dagre";

export type DagreTreeLayoutDirection = "vertical" | "horizontal";

export type DagreTreeRoot = {
  id: string;
  name: string;
  slug?: string;
  children?: DagreTreeRoot[];
};

const NODE_WIDTH = 172;
const NODE_HEIGHT = 36;

function walkTree(
  node: DagreTreeRoot,
  parentId: string | null,
  nodes: Node[],
  edges: Edge[],
): void {
  nodes.push({
    id: node.id,
    data: { label: node.name },
    position: { x: 0, y: 0 },
  });

  if (parentId) {
    edges.push({
      id: `${parentId}-${node.id}`,
      source: parentId,
      target: node.id,
      type: "smoothstep",
    });
  }

  for (const child of node.children ?? []) {
    walkTree(child, node.id, nodes, edges);
  }
}

export function treeToFlowElements(
  root: DagreTreeRoot,
  direction: DagreTreeLayoutDirection = "vertical",
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  walkTree(root, null, nodes, edges);
  return getLayoutedElements(nodes, edges, direction);
}

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: DagreTreeLayoutDirection,
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  const rankdir = direction === "horizontal" ? "LR" : "TB";
  const isHorizontal = direction === "horizontal";

  dagreGraph.setGraph({ rankdir });

  for (const node of nodes) {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  for (const edge of edges) {
    dagreGraph.setEdge(edge.source, edge.target);
  }

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
