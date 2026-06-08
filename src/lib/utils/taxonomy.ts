import { TAXONOMY_RESOURCES } from "@/constants/taxonomy/resources";
import type { DagreTreeRoot } from "@/lib/utils/dagre-tree";
import type {
  CourseSkill,
  CourseTopic,
  TaxonomyEntity,
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

/** Extract nested tree nodes from a taxonomy entity (topics/skills only). */
export function getTaxonomyTreeFromEntity(
  resourceKey: TaxonomyResourceKey,
  entity: TaxonomyEntity | null | undefined,
): TaxonomyTreeNode[] {
  if (!entity) return [];
  if (resourceKey === "topics") {
    return (entity as CourseTopic).child_topics ?? [];
  }
  if (resourceKey === "skills") {
    return (entity as CourseSkill).children ?? [];
  }
  return [];
}

/** Build a dagre root with the list row as root and nested nodes as children. */
export function buildTaxonomyDagreRoot(
  resourceKey: TaxonomyResourceKey,
  row: CourseTopic | CourseSkill,
): DagreTreeRoot {
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    children: getTaxonomyTreeFromEntity(resourceKey, row),
  };
}

/** Strip slug before create/update payloads; BE derives slug from each node name. */
export function toTaxonomyTreeWritePayload(
  nodes: TaxonomyTreeNode[],
): TaxonomyTreeNode[] {
  return nodes.map(({ id, name, children }) => ({
    id,
    name,
    children: children?.length
      ? toTaxonomyTreeWritePayload(children)
      : undefined,
  }));
}

/** New empty tree node for taxonomy editors (local slug preview only). */
export function createTaxonomyTreeNode(name = ""): TaxonomyTreeNode {
  return {
    id: crypto.randomUUID(),
    name,
    children: [],
  };
}

/** Count nodes in a taxonomy tree (for button hints and disabled state). */
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
