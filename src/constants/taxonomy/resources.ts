import { PERMISSIONS } from "@/constants/permissions";
import type { PermissionName } from "@/types/permissions";
import type {
  TaxonomyListColumn,
  TaxonomyResourceConfig,
  TaxonomyResourceKey,
} from "@/types/taxonomy";

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
      { id: "child_render" },
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
      { id: "child_render" },
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

/** Any taxonomy read permission — used to show the sidebar group. */
export const TAXONOMY_GROUP_READ_PERMISSIONS = [
  PERMISSIONS.CourseLevelRead,
  PERMISSIONS.TopicRead,
  PERMISSIONS.CourseOutcomeRead,
  PERMISSIONS.CourseSkillRead,
  PERMISSIONS.TagRead,
] as const satisfies readonly PermissionName[];
