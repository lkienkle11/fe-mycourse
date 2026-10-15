/**
 * Generic helpers over any nested `{ id, children? }` structure. Feature rules
 * (taxonomy slugs, navigation, layout) stay in their own modules and consume
 * these primitives; nothing here imports feature code.
 */

/** Any node with a stable id and optional nested children of the same shape. */
export type TreeNodeLike<T> = { id: string; children?: T[] };

export type TreeVisitContext<T> = {
  depth: number;
  parent: T | null;
  index: number;
};

/** Pre-order depth-first walk; root nodes have depth 0. */
export function walkTree<T extends TreeNodeLike<T>>(
  nodes: readonly T[] | undefined,
  visit: (node: T, context: TreeVisitContext<T>) => void,
  parent: T | null = null,
  depth = 0,
): void {
  if (!nodes) return;
  nodes.forEach((node, index) => {
    visit(node, { depth, parent, index });
    walkTree(node.children, visit, node, depth + 1);
  });
}

/** Every node in pre-order. */
export function flattenTree<T extends TreeNodeLike<T>>(
  nodes: readonly T[] | undefined,
): T[] {
  const out: T[] = [];
  walkTree(nodes, (node) => {
    out.push(node);
  });
  return out;
}

export function countTreeNodes<T extends TreeNodeLike<T>>(
  nodes: readonly T[] | undefined,
): number {
  return flattenTree(nodes).length;
}

/** Roots are depth 0; an empty tree is 0. */
export function getTreeMaxDepth<T extends TreeNodeLike<T>>(
  nodes: readonly T[] | undefined,
): number {
  let max = 0;
  walkTree(nodes, (_node, { depth }) => {
    max = Math.max(max, depth);
  });
  return max;
}

/** Ancestor chain down to (and including) the first match in pre-order, else `null`. */
export function findTreePath<T extends TreeNodeLike<T>>(
  nodes: readonly T[] | undefined,
  predicate: (node: T) => boolean,
  ancestors: readonly T[] = [],
): T[] | null {
  for (const node of nodes ?? []) {
    const path = [...ancestors, node];
    if (predicate(node)) return path;
    const found = findTreePath(node.children, predicate, path);
    if (found) return found;
  }
  return null;
}

export function findTreeNodeById<T extends TreeNodeLike<T>>(
  nodes: readonly T[] | undefined,
  id: string,
): T | null {
  const path = findTreePath(nodes, (node) => node.id === id);
  return path ? path[path.length - 1] : null;
}

/**
 * Immutable update of the node with `id` at any depth. Untouched branches are
 * shared; returns the same array when `id` is not present.
 */
export function updateTreeNode<T extends TreeNodeLike<T>>(
  nodes: T[],
  id: string,
  patch: (node: T) => T,
): T[] {
  let changed = false;
  const next = nodes.map((node) => {
    if (node.id === id) {
      changed = true;
      return patch(node);
    }
    if (!node.children?.length) return node;
    const children = updateTreeNode(node.children, id, patch);
    if (children === node.children) return node;
    changed = true;
    return { ...node, children };
  });
  return changed ? next : nodes;
}
