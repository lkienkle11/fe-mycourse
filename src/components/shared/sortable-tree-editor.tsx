"use client";

import { SortableList } from "@/components/shared/sortable-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugifyName } from "@/lib/utils";

export type SortableTreeNode = {
  id: string;
  name: string;
  slug: string;
  children?: SortableTreeNode[];
};

export type SortableTreeEditorLabels = {
  dragHandle: string;
  namePlaceholder: string;
  slugPlaceholder: string;
  addChild: string;
  remove: string;
};

export function createSortableTreeNode(name = ""): SortableTreeNode {
  return {
    id: crypto.randomUUID(),
    name,
    slug: slugifyName(name),
    children: [],
  };
}

type TreeLevelProps = {
  nodes: SortableTreeNode[];
  depth: number;
  indentPx: number;
  labels: SortableTreeEditorLabels;
  createNode: () => SortableTreeNode;
  onChange: (nodes: SortableTreeNode[]) => void;
};

function TreeLevel({
  nodes,
  depth,
  indentPx,
  labels,
  createNode,
  onChange,
}: TreeLevelProps) {
  return (
    <SortableList
      items={nodes}
      dragLabel={labels.dragHandle}
      onReorder={onChange}
      renderItem={(node, index) => (
        <div className="space-y-2" style={{ marginLeft: depth * indentPx }}>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {labels.namePlaceholder}
              </Label>
              <Input
                value={node.name}
                placeholder={labels.namePlaceholder}
                onChange={(event) => {
                  const next = [...nodes];
                  const name = event.target.value;
                  next[index] = {
                    ...node,
                    name,
                    slug: slugifyName(name),
                  };
                  onChange(next);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {labels.slugPlaceholder}
              </Label>
              <Input
                readOnly
                value={slugifyName(node.name)}
                className="cursor-not-allowed bg-muted"
                aria-readonly
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                const next = [...nodes];
                const children = [...(node.children ?? []), createNode()];
                next[index] = { ...node, children };
                onChange(next);
              }}
            >
              {labels.addChild}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onChange(nodes.filter((item) => item.id !== node.id));
              }}
            >
              {labels.remove}
            </Button>
          </div>
          {node.children && node.children.length > 0 ? (
            <TreeLevel
              nodes={node.children}
              depth={depth + 1}
              indentPx={indentPx}
              labels={labels}
              createNode={createNode}
              onChange={(children) => {
                const next = [...nodes];
                next[index] = { ...node, children };
                onChange(next);
              }}
            />
          ) : null}
        </div>
      )}
    />
  );
}

export type SortableTreeEditorProps = {
  nodes: SortableTreeNode[];
  onChange: (nodes: SortableTreeNode[]) => void;
  labels: SortableTreeEditorLabels;
  /** Horizontal indent per nesting level (default 12px). */
  indentPx?: number;
  createNode?: () => SortableTreeNode;
};

/**
 * Nested sortable tree: name + read-only slug per node, drag reorder among siblings.
 * Slug is derived from name via `slugifyName`.
 */
export function SortableTreeEditor({
  nodes,
  onChange,
  labels,
  indentPx = 12,
  createNode = createSortableTreeNode,
}: SortableTreeEditorProps) {
  return (
    <div className="space-y-2">
      <TreeLevel
        nodes={nodes}
        depth={0}
        indentPx={indentPx}
        labels={labels}
        createNode={createNode}
        onChange={onChange}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onChange([...nodes, createNode()])}
      >
        {labels.addChild}
      </Button>
    </div>
  );
}
