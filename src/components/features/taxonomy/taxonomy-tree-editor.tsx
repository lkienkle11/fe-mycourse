"use client";

import { useTranslations } from "next-intl";
import { SortableList } from "@/components/shared/sortable-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TAXONOMY_NAME_MAX_LENGTH } from "@/constants/taxonomy/limits";
import {
  createTaxonomyTreeNode,
  TAXONOMY_TREE_INDENT_PX,
} from "@/lib/utils/taxonomy";
import { updateTreeNode } from "@/lib/utils/tree";
import type { TaxonomyResourceKey, TaxonomyTreeNode } from "@/types/taxonomy";
import {
  TreeNodeSlugField,
  type TreeNodeSlugFieldLabels,
} from "./tree-node-slug-field";

type TreeLabels = TreeNodeSlugFieldLabels & {
  dragHandle: string;
  namePlaceholder: string;
  addChild: string;
  remove: string;
};

export type TaxonomyTreeEditorProps = {
  resourceKey: TaxonomyResourceKey;
  value: TaxonomyTreeNode[];
  onChange: (value: TaxonomyTreeNode[]) => void;
  /** Active content locale — edits `translations[locale].name`. */
  editLocale?: string;
  /** Node id -> resolved slug error message (shown on that node). */
  slugErrors?: Readonly<Record<string, string>>;
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

/** The slug is not locale-bound: it is never written under `translations`. */
function patchNodeSlug(
  node: TaxonomyTreeNode,
  value: string,
): TaxonomyTreeNode {
  return { ...node, slug: value };
}

type TreeLevelProps = {
  nodes: TaxonomyTreeNode[];
  depth: number;
  labels: TreeLabels;
  onChange: (nodes: TaxonomyTreeNode[]) => void;
  editLocale?: string;
  slugErrors?: Readonly<Record<string, string>>;
};

function TreeLevel({
  nodes,
  depth,
  labels,
  onChange,
  editLocale,
  slugErrors,
}: TreeLevelProps) {
  return (
    <SortableList
      items={nodes}
      dragLabel={labels.dragHandle}
      onReorder={onChange}
      renderItem={(node) => {
        const patch = (
          change: (current: TaxonomyTreeNode) => TaxonomyTreeNode,
        ) => onChange(updateTreeNode(nodes, node.id, change));
        return (
          <div
            className="space-y-2"
            style={{ marginLeft: depth * TAXONOMY_TREE_INDENT_PX }}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {labels.namePlaceholder}
                </Label>
                <Input
                  value={getNodeDisplayName(node, editLocale)}
                  placeholder={labels.namePlaceholder}
                  maxLength={TAXONOMY_NAME_MAX_LENGTH}
                  onChange={(event) =>
                    patch((current) =>
                      patchNodeName(current, event.target.value, editLocale),
                    )
                  }
                />
              </div>
              <TreeNodeSlugField
                slug={node.slug ?? ""}
                labels={labels}
                error={slugErrors?.[node.id]}
                onSlugChange={(value) =>
                  patch((current) => patchNodeSlug(current, value))
                }
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  patch((current) => ({
                    ...current,
                    children: [
                      ...(current.children ?? []),
                      createTaxonomyTreeNode(),
                    ],
                  }))
                }
              >
                {labels.addChild}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  onChange(nodes.filter((item) => item.id !== node.id))
                }
              >
                {labels.remove}
              </Button>
            </div>
            {node.children && node.children.length > 0 ? (
              <TreeLevel
                nodes={node.children}
                depth={depth + 1}
                labels={labels}
                editLocale={editLocale}
                slugErrors={slugErrors}
                onChange={(children) =>
                  patch((current) => ({ ...current, children }))
                }
              />
            ) : null}
          </div>
        );
      }}
    />
  );
}

/**
 * Nested sortable tree editor for topics (`child_topics`) and skills
 * (`children`): per-locale name editing, drag reorder among siblings and an
 * inline per-node slug (written only when the user supplies or changes it).
 */
export function TaxonomyTreeEditor({
  resourceKey,
  value,
  onChange,
  editLocale,
  slugErrors,
}: TaxonomyTreeEditorProps) {
  const t = useTranslations(
    resourceKey === "skills" ? "taxonomy.treeSkills" : "taxonomy.tree",
  );
  const labels: TreeLabels = {
    dragHandle: t("dragHandle"),
    namePlaceholder: t("namePlaceholder"),
    slugPlaceholder: t("slugPlaceholder"),
    slugAuto: t("slugAuto"),
    slugEdit: t("slugEdit"),
    slugDone: t("slugDone"),
    addChild: t("addChild"),
    remove: t("remove"),
  };

  return (
    <div className="space-y-2">
      <TreeLevel
        nodes={value}
        depth={0}
        labels={labels}
        onChange={onChange}
        editLocale={editLocale}
        slugErrors={slugErrors}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onChange([...value, createTaxonomyTreeNode()])}
      >
        {labels.addChild}
      </Button>
    </div>
  );
}
