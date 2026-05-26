"use client";

import { useTranslations } from "next-intl";
import { SortableTreeEditor } from "@/components/shared/sortable-tree-editor";
import type { TaxonomyResourceKey, TaxonomyTreeNode } from "@/types/taxonomy";

export type TaxonomyTreeEditorProps = {
  resourceKey: TaxonomyResourceKey;
  value: TaxonomyTreeNode[];
  onChange: (value: TaxonomyTreeNode[]) => void;
};

export function TaxonomyTreeEditor({
  resourceKey,
  value,
  onChange,
}: TaxonomyTreeEditorProps) {
  const t = useTranslations(
    resourceKey === "skills" ? "taxonomy.treeSkills" : "taxonomy.tree",
  );

  return (
    <SortableTreeEditor
      nodes={value}
      onChange={onChange}
      labels={{
        dragHandle: t("dragHandle"),
        namePlaceholder: t("namePlaceholder"),
        slugPlaceholder: t("slugPlaceholder"),
        addChild: t("addChild"),
        remove: t("remove"),
      }}
    />
  );
}
