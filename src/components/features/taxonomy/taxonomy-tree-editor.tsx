"use client";

import { useTranslations } from "next-intl";
import { SortableTreeEditor } from "@/components/shared/sortable-tree-editor";
import type { TaxonomyResourceKey, TaxonomyTreeNode } from "@/types/taxonomy";

export type TaxonomyTreeEditorProps = {
  resourceKey: TaxonomyResourceKey;
  value: TaxonomyTreeNode[];
  onChange: (value: TaxonomyTreeNode[]) => void;
  /** Active content locale — edits `translations[locale].name`. */
  editLocale?: string;
};

export function TaxonomyTreeEditor({
  resourceKey,
  value,
  onChange,
  editLocale,
}: TaxonomyTreeEditorProps) {
  const t = useTranslations(
    resourceKey === "skills" ? "taxonomy.treeSkills" : "taxonomy.tree",
  );

  return (
    <SortableTreeEditor
      nodes={value}
      onChange={onChange}
      editLocale={editLocale}
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
