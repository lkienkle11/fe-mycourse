import { PERMISSIONS } from "@/constants/permissions";
import type { PermissionName } from "@/types/permissions";
import type { TaxonomyResourceKey } from "@/types/taxonomy";

export type TaxonomyListColumnId =
  | "name"
  | "slug"
  | "short_description"
  | "status"
  | "child_count"
  | "updated_at";

export type TaxonomyListColumn = {
  id: TaxonomyListColumnId;
  /** BE `sort_by` value; omit when column is not sortable. */
  sortKey?: string;
};

export type TaxonomyResourceConfig = {
  key: TaxonomyResourceKey;
  apiSegment: string;
  permissions: {
    read: string;
    create: string;
    update: string;
    delete: string;
  };
  hasTree: boolean;
  /** JSON field name on create/update payloads when `hasTree` is true. */
  treeField?: "child_topics" | "children";
  hasDescriptionList: boolean;
  supportsImage: boolean;
  listColumns: TaxonomyListColumn[];
};

export const TAXONOMY_RESOURCE_KEYS = [
  "levels",
  "topics",
  "outcomes",
  "skills",
  "tags",
] as const satisfies readonly TaxonomyResourceKey[];

const slugStatusColumns: TaxonomyListColumn[] = [
  { id: "name", sortKey: "name" },
  { id: "slug", sortKey: "slug" },
  { id: "status", sortKey: "status" },
  { id: "updated_at", sortKey: "created_at" },
];

export const TAXONOMY_RESOURCES: Record<
  TaxonomyResourceKey,
  TaxonomyResourceConfig
> = {
  levels: {
    key: "levels",
    apiSegment: "levels",
    permissions: {
      read: PERMISSIONS.CourseLevelRead,
      create: PERMISSIONS.CourseLevelCreate,
      update: PERMISSIONS.CourseLevelUpdate,
      delete: PERMISSIONS.CourseLevelDelete,
    },
    hasTree: false,
    hasDescriptionList: false,
    supportsImage: false,
    listColumns: slugStatusColumns,
  },
  tags: {
    key: "tags",
    apiSegment: "tags",
    permissions: {
      read: PERMISSIONS.TagRead,
      create: PERMISSIONS.TagCreate,
      update: PERMISSIONS.TagUpdate,
      delete: PERMISSIONS.TagDelete,
    },
    hasTree: false,
    hasDescriptionList: false,
    supportsImage: false,
    listColumns: slugStatusColumns,
  },
  topics: {
    key: "topics",
    apiSegment: "topics",
    permissions: {
      read: PERMISSIONS.TopicRead,
      create: PERMISSIONS.TopicCreate,
      update: PERMISSIONS.TopicUpdate,
      delete: PERMISSIONS.TopicDelete,
    },
    hasTree: true,
    treeField: "child_topics",
    hasDescriptionList: false,
    supportsImage: true,
    listColumns: [
      { id: "name", sortKey: "name" },
      { id: "slug", sortKey: "slug" },
      { id: "status", sortKey: "status" },
      { id: "child_count" },
      { id: "updated_at", sortKey: "created_at" },
    ],
  },
  skills: {
    key: "skills",
    apiSegment: "skills",
    permissions: {
      read: PERMISSIONS.CourseSkillRead,
      create: PERMISSIONS.CourseSkillCreate,
      update: PERMISSIONS.CourseSkillUpdate,
      delete: PERMISSIONS.CourseSkillDelete,
    },
    hasTree: true,
    treeField: "children",
    hasDescriptionList: false,
    supportsImage: false,
    listColumns: [
      { id: "name", sortKey: "name" },
      { id: "slug", sortKey: "slug" },
      { id: "status", sortKey: "status" },
      { id: "child_count" },
      { id: "updated_at", sortKey: "created_at" },
    ],
  },
  outcomes: {
    key: "outcomes",
    apiSegment: "outcomes",
    permissions: {
      read: PERMISSIONS.CourseOutcomeRead,
      create: PERMISSIONS.CourseOutcomeCreate,
      update: PERMISSIONS.CourseOutcomeUpdate,
      delete: PERMISSIONS.CourseOutcomeDelete,
    },
    hasTree: false,
    hasDescriptionList: true,
    supportsImage: true,
    listColumns: [
      { id: "short_description" },
      { id: "status", sortKey: "status" },
      { id: "updated_at", sortKey: "created_at" },
    ],
  },
};

export function getTaxonomyResourceConfig(
  resourceKey: TaxonomyResourceKey,
): TaxonomyResourceConfig {
  return TAXONOMY_RESOURCES[resourceKey];
}

/** Any taxonomy read permission — used to show the sidebar group. */
export const TAXONOMY_GROUP_READ_PERMISSIONS: readonly PermissionName[] =
  TAXONOMY_RESOURCE_KEYS.map(
    (key) => TAXONOMY_RESOURCES[key].permissions.read as PermissionName,
  );
