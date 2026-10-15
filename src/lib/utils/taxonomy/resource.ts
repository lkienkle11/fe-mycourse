import { TAXONOMY_RESOURCES } from "@/constants/taxonomy/resources";
import type { DagreTreeRoot } from "@/lib/utils/dagre-tree";
import { changedNonBlank, payloadField } from "@/lib/utils/payload";
import { flattenTree } from "@/lib/utils/tree";
import { newV7 } from "@/lib/utils/uuid";
import { optionalSlugField, requiredSlugField } from "@/schema/shared";
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

/**
 * Tree projection for create/update payloads (id, name, slug, translations,
 * children). A node's `slug` is written only when it is non-blank and differs
 * from its persisted value (`persistedSlugs`: node id -> stored slug; absent
 * for a new node), so untouched nodes are preserved by id by the backend.
 */
export function toTaxonomyTreeWritePayload(
  nodes: TaxonomyTreeNode[],
  persistedSlugs: ReadonlyMap<string, string> = new Map(),
): TaxonomyTreeNode[] {
  return nodes.map(({ id, name, slug, translations, children }) => ({
    id,
    name,
    ...payloadField(
      "slug",
      changedNonBlank(slug ?? "", persistedSlugs.get(id) ?? ""),
    ),
    ...(translations ? { translations } : {}),
    children: children?.length
      ? toTaxonomyTreeWritePayload(children, persistedSlugs)
      : undefined,
  }));
}

/** `node id -> stored slug` for every node; membership means "already persisted". */
export function collectTaxonomyTreeSlugs(
  nodes: TaxonomyTreeNode[],
): Map<string, string> {
  return new Map(flattenTree(nodes).map((node) => [node.id, node.slug ?? ""]));
}

/**
 * Validates every node slug with the shared slug rules: a persisted node needs
 * a non-blank slug, a new node may leave it blank. Returns `node id -> zod
 * message key` (`validation.slugRequired|slugInvalid|slugMax`) for failures.
 */
export function validateTaxonomyTreeSlugs(
  nodes: TaxonomyTreeNode[],
  persistedSlugs: ReadonlyMap<string, string>,
): Record<string, string> {
  const issues: Record<string, string> = {};
  for (const node of flattenTree(nodes)) {
    const field = persistedSlugs.has(node.id)
      ? requiredSlugField
      : optionalSlugField;
    const result = field.safeParse((node.slug ?? "").trim());
    if (!result.success) {
      issues[node.id] =
        result.error.issues[0]?.message ?? "validation.slugInvalid";
    }
  }
  return issues;
}

/**
 * True when a node slug that was sent comes back different from the stored one
 * (the backend resolved an in-tree collision with a suffix).
 */
export function hasAdjustedTaxonomyTreeSlugs(
  sent: TaxonomyTreeNode[],
  saved: TaxonomyTreeNode[],
): boolean {
  const savedSlugs = collectTaxonomyTreeSlugs(saved);
  return flattenTree(sent).some((node) => {
    if (!node.slug) return false;
    const storedSlug = savedSlugs.get(node.id);
    return storedSlug !== undefined && storedSlug !== node.slug;
  });
}

/** New empty tree node; no slug (the backend generates it unless the user types one). */
export function createTaxonomyTreeNode(name = ""): TaxonomyTreeNode {
  return {
    id: newV7(),
    name,
    translations: name ? { en: { name } } : {},
    children: [],
  };
}
