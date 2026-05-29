import { TAXONOMY_RESOURCES } from "@/constants/taxonomy/resources";
import type {
  TaxonomyListColumnId,
  TaxonomyResourceConfig,
  TaxonomyResourceKey,
  TaxonomyTreeNode,
} from "@/types/taxonomy";

const TAXONOMY_SEARCHABLE_COLUMNS: Readonly<
  Record<TaxonomyResourceKey, readonly TaxonomyListColumnId[]>
> = {
  levels: ["name", "slug"],
  tags: ["name", "slug"],
  topics: ["name", "slug"],
  skills: ["name", "slug"],
  outcomes: ["short_description"],
};

export function getTaxonomyResourceConfig(
  resourceKey: TaxonomyResourceKey,
): TaxonomyResourceConfig {
  return TAXONOMY_RESOURCES[resourceKey];
}

export function getTaxonomySearchableColumns(
  resourceKey: TaxonomyResourceKey,
): readonly TaxonomyListColumnId[] {
  return TAXONOMY_SEARCHABLE_COLUMNS[resourceKey];
}

/** Count nodes in a taxonomy tree (for list column display). */
export function countTaxonomyTreeNodes(
  nodes: TaxonomyTreeNode[] | undefined,
): number {
  if (!nodes?.length) return 0;
  let count = 0;
  for (const node of nodes) {
    count += 1;
    count += countTaxonomyTreeNodes(node.children);
  }
  return count;
}
