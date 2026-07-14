"use client";

import { SortableList } from "@/components/shared/sortable-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugifyName } from "@/lib/utils";
import { createTaxonomyTreeNode } from "@/lib/utils/taxonomy";
import type { TaxonomyTreeNode } from "@/types/taxonomy";

export type SortableTreeEditorLabels = {
  dragHandle: string;
  namePlaceholder: string;
  slugPlaceholder: string;
  addChild: string;
  remove: string;
};

type TreeLevelProps = {
  nodes: TaxonomyTreeNode[];
  depth: number;
  indentPx: number;
  labels: SortableTreeEditorLabels;
  createNode: () => TaxonomyTreeNode;
  onChange: (nodes: TaxonomyTreeNode[]) => void;
  /** When set, edits `translations[editLocale].name` (and mirrors canonical when `en`). */
  editLocale?: string;
};

function getNodeDisplayName(
  node: TaxonomyTreeNode,
  editLocale?: string,
): string {
  if (!editLocale) return node.name;
  const translated = node.translations?.[editLocale]?.name;
  if (translated != null && translated !== "") return translated;
  if (editLocale === "en") return node.name;
  return "";
}

function patchNodeName(
  node: TaxonomyTreeNode,
  value: string,
  editLocale?: string,
): TaxonomyTreeNode {
  if (!editLocale) {
    return { ...node, name: value };
  }
  const translations = {
    ...(node.translations ?? {}),
    [editLocale]: { name: value },
  };
  if (editLocale === "en") {
    return { ...node, name: value, translations };
  }
  return { ...node, translations };
}

function TreeLevel({
  nodes,
  depth,
  indentPx,
  labels,
  createNode,
  onChange,
  editLocale,
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
                value={getNodeDisplayName(node, editLocale)}
                placeholder={labels.namePlaceholder}
                maxLength={255}
                onChange={(event) => {
                  const next = [...nodes];
                  next[index] = patchNodeName(
                    node,
                    event.target.value,
                    editLocale,
                  );
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
              editLocale={editLocale}
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
  nodes: TaxonomyTreeNode[];
  onChange: (nodes: TaxonomyTreeNode[]) => void;
  labels: SortableTreeEditorLabels;
  /** Horizontal indent per nesting level (default 12px). */
  indentPx?: number;
  createNode?: () => TaxonomyTreeNode;
  /** When set, edits `translations[editLocale].name`. */
  editLocale?: string;
};

/**
 * Nested sortable tree: name + read-only slug per node, drag reorder among siblings.
 * Uses shared `TaxonomyTreeNode`; slug preview via `slugifyName` (not stored on write).
 */
export function SortableTreeEditor({
  nodes,
  onChange,
  labels,
  indentPx = 12,
  createNode = createTaxonomyTreeNode,
  editLocale,
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
        editLocale={editLocale}
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
